import {
  MonitorRunAccountStatus,
  MonitorRunStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import {
  APIFY_DETAILS_PARSER_VERSION,
  normalizeApifyDetailsItem,
  type NormalizedAccountOutcome,
} from "./apify-details";
import type { ApifyProvider, ApifyRun } from "./apify-client";

const SUCCESSFUL_ACCOUNT_STATUSES = new Set<MonitorRunAccountStatus>([
  "RETRIEVED",
  "EMPTY",
  "FALLBACK_REQUIRED",
]);
const FINAL_INGESTION_STATUSES = new Set<MonitorRunStatus>([
  "RETRIEVED",
  "PROCESSING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
]);
const DAY_MS = 24 * 60 * 60 * 1000;

type DbClient = PrismaClient;

export interface IngestionTestHooks {
  beforeCommit?: () => void | Promise<void>;
}

export interface IngestApifyRunOptions {
  prisma: DbClient;
  provider: ApifyProvider;
  callbackRunId: string;
  now?: Date;
  hooks?: IngestionTestHooks;
}

export interface IngestionResult {
  disposition: "ingested" | "already_ingested" | "in_progress";
  runId: string;
  status: MonitorRunStatus;
  accountsRetrieved: number;
  postsRetrieved: number;
  postIds: string[];
}

export class UnknownMonitorRunError extends Error {
  constructor(callbackRunId: string) {
    super(`No Turnout monitor run exists for Apify run ${callbackRunId}`);
    this.name = "UnknownMonitorRunError";
  }
}

export async function ingestApifyRun(
  options: IngestApifyRunOptions
): Promise<IngestionResult> {
  const now = options.now ?? new Date();
  const storedRun = await options.prisma.monitorRun.findUnique({
    where: { externalRunId: options.callbackRunId },
    include: {
      accounts: {
        include: { account: true },
      },
    },
  });

  if (!storedRun?.externalRunId) {
    throw new UnknownMonitorRunError(options.callbackRunId);
  }

  // The callback identifies our record. All provider storage identifiers come
  // from the authoritative run fetched using the ID already stored in Neon.
  const providerRun = await options.provider.getRun(storedRun.externalRunId);
  if (providerRun.id !== storedRun.externalRunId) {
    throw new Error("Apify returned a run that does not match the stored run ID");
  }

  let datasetItems: unknown[] = [];
  let validationError: Error | null = null;

  if (providerRun.status !== "SUCCEEDED") {
    validationError = new Error(
      `Apify run ended with status ${providerRun.status}`
    );
  } else if (!providerRun.defaultDatasetId) {
    validationError = new Error("Apify run has no default dataset");
  } else {
    try {
      datasetItems = await options.provider.getDatasetItems(
        providerRun.defaultDatasetId
      );
      if (datasetItems.length === 0) {
        validationError = new Error(
          "Apify run succeeded but returned zero dataset items"
        );
      }
    } catch (error) {
      validationError = toError(error);
    }
  }

  let normalizedByHandle = new Map<string, NormalizedAccountOutcome>();
  if (!validationError) {
    try {
      normalizedByHandle = normalizeDataset(
        datasetItems,
        storedRun.accounts,
        storedRun.retrievalWindowStart,
        now
      );
    } catch (error) {
      validationError = toError(error);
    }
  }

  return options.prisma.$transaction(async (tx) => {
    const lockRows = await tx.$queryRaw<Array<{ acquired: boolean }>>`
      SELECT pg_try_advisory_xact_lock(
        hashtextextended(${storedRun.id}, 0)
      ) AS acquired
    `;
    if (!lockRows[0]?.acquired) {
      return {
        disposition: "in_progress",
        runId: storedRun.id,
        status: "RETRIEVING",
        accountsRetrieved: 0,
        postsRetrieved: 0,
        postIds: [],
      };
    }

    const claimedRun = await tx.monitorRun.findUniqueOrThrow({
      where: { id: storedRun.id },
    });

    if (FINAL_INGESTION_STATUSES.has(claimedRun.status)) {
      return {
        disposition: "already_ingested",
        runId: claimedRun.id,
        status: claimedRun.status,
        accountsRetrieved: claimedRun.accountsRetrieved,
        postsRetrieved: claimedRun.postsRetrieved,
        postIds: [],
      };
    }

    await tx.monitorRun.update({
      where: { id: claimedRun.id },
      data: { status: "RETRIEVING" },
    });

    if (validationError) {
      await markRunAndAccountsFailed(
        tx,
        storedRun.id,
        providerRun,
        validationError,
        storedRun.accounts.map((requested) => requested.accountId),
        now
      );
      await options.hooks?.beforeCommit?.();

      return {
        disposition: "ingested",
        runId: storedRun.id,
        status: "FAILED",
        accountsRetrieved: 0,
        postsRetrieved: 0,
        postIds: [],
      };
    }

    const ingestedPostIds = new Set<string>();
    const outcomes: NormalizedAccountOutcome[] = [];

    for (const requested of storedRun.accounts) {
      const handle = normalizeHandle(requested.account.handle);
      const outcome =
        normalizedByHandle.get(handle) ?? missingAccountOutcome(requested.providerInputUrl, handle);
      outcomes.push(outcome);

      await tx.monitorRunAccount.upsert({
        where: {
          runId_accountId: {
            runId: storedRun.id,
            accountId: requested.accountId,
          },
        },
        create: {
          runId: storedRun.id,
          accountId: requested.accountId,
          providerInputUrl: requested.providerInputUrl,
          status: outcome.status,
          providerAccountId: outcome.providerAccountId,
          postsRetrieved: outcome.posts.length,
          needsFallback: outcome.status === "FALLBACK_REQUIRED",
          fallbackReason: outcome.fallbackReasons.join(",") || null,
          errorCode: outcome.errorCode,
          errorMessage: outcome.errorMessage,
          completedAt: now,
        },
        update: {
          status: outcome.status,
          providerAccountId: outcome.providerAccountId,
          postsRetrieved: outcome.posts.length,
          needsFallback: outcome.status === "FALLBACK_REQUIRED",
          fallbackReason: outcome.fallbackReasons.join(",") || null,
          errorCode: outcome.errorCode,
          errorMessage: outcome.errorMessage,
          completedAt: now,
        },
      });

      for (const post of outcome.posts) {
        const storedPost = await tx.instagramPost.upsert({
          where: {
            accountId_shortcode: {
              accountId: requested.accountId,
              shortcode: post.shortcode,
            },
          },
          create: {
            accountId: requested.accountId,
            providerPostId: post.providerPostId,
            shortcode: post.shortcode,
            canonicalUrl: post.canonicalUrl,
            caption: post.caption,
            publishedAt: post.publishedAt,
            mediaUrl: post.mediaUrl,
            media: post.media as Prisma.InputJsonValue,
            providerSchemaVersion: post.providerSchemaVersion,
            providerDatasetId: providerRun.defaultDatasetId!,
          },
          update: {
            providerPostId: post.providerPostId,
            canonicalUrl: post.canonicalUrl,
            caption: post.caption,
            publishedAt: post.publishedAt,
            mediaUrl: post.mediaUrl,
            media: post.media as Prisma.InputJsonValue,
            providerSchemaVersion: post.providerSchemaVersion,
            providerDatasetId: providerRun.defaultDatasetId!,
          },
          select: { id: true },
        });
        ingestedPostIds.add(storedPost.id);
      }

      await updateAccountHealth(tx, requested.accountId, outcome, now);
    }

    const accountsRetrieved = storedRun.accounts.filter((requested) =>
      normalizedByHandle.has(normalizeHandle(requested.account.handle))
    ).length;
    const successfulAccounts = outcomes.filter((outcome) =>
      SUCCESSFUL_ACCOUNT_STATUSES.has(outcome.status)
    ).length;
    const status = resolveRunStatus(outcomes, successfulAccounts);
    const errorSummary = summarizeOutcomeErrors(outcomes);

    await tx.monitorRun.update({
      where: { id: storedRun.id },
      data: {
        status,
        externalDatasetId: providerRun.defaultDatasetId!,
        providerSchemaVersion: APIFY_DETAILS_PARSER_VERSION,
        accountsRetrieved,
        postsRetrieved: ingestedPostIds.size,
        errorSummary,
        retrievedAt: now,
      },
    });

    await options.hooks?.beforeCommit?.();

    return {
      disposition: "ingested",
      runId: storedRun.id,
      status,
      accountsRetrieved,
      postsRetrieved: ingestedPostIds.size,
      postIds: [...ingestedPostIds],
    };
  });
}

function normalizeDataset(
  items: unknown[],
  requestedAccounts: Array<{
    providerInputUrl: string;
    account: { handle: string; lastRetrievedAt: Date | null };
  }>,
  retrievalWindowStart: Date,
  now: Date
): Map<string, NormalizedAccountOutcome> {
  const requestedByHandle = new Map(
    requestedAccounts.map((item) => [
      normalizeHandle(item.account.handle),
      item,
    ])
  );
  const normalized = new Map<string, NormalizedAccountOutcome>();

  for (const item of items) {
    const rawHandle = extractRawHandle(item);
    const requested = requestedByHandle.get(rawHandle);
    if (!requested) {
      throw new Error(`Dataset contains unrequested account @${rawHandle}`);
    }

    const outcome = normalizeApifyDetailsItem(item, {
      retrievalWindowStart,
      now,
      previousSuccessfulRetrievalAt: requested.account.lastRetrievedAt,
    });
    const handle = normalizeHandle(outcome.handle);
    if (normalized.has(handle)) {
      throw new Error(`Dataset contains duplicate outcome for @${handle}`);
    }
    normalized.set(handle, outcome);
  }

  return normalized;
}

function extractRawHandle(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    throw new Error("Dataset item is not an object");
  }

  const item = raw as Record<string, unknown>;
  if (typeof item.username === "string" && item.username.trim()) {
    return normalizeHandle(item.username);
  }
  if (typeof item.inputUrl === "string") {
    try {
      const segment = new URL(item.inputUrl).pathname.split("/").filter(Boolean)[0];
      if (segment) return normalizeHandle(segment);
    } catch {
      // The parser below will provide the final schema error.
    }
  }
  throw new Error("Dataset item does not identify an Instagram account");
}

function missingAccountOutcome(
  inputUrl: string,
  handle: string
): NormalizedAccountOutcome {
  return {
    status: "FAILED",
    inputUrl,
    handle,
    providerAccountId: null,
    posts: [],
    fallbackReasons: [],
    errorCode: "missing_account_result",
    errorMessage: "Apify dataset did not contain an outcome for this account",
    providerSchemaVersion: APIFY_DETAILS_PARSER_VERSION,
  };
}

async function updateAccountHealth(
  tx: Prisma.TransactionClient,
  accountId: string,
  outcome: NormalizedAccountOutcome,
  now: Date
): Promise<void> {
  const successful = SUCCESSFUL_ACCOUNT_STATUSES.has(outcome.status);
  await tx.watchedAccount.update({
    where: { id: accountId },
    data: successful
      ? {
          lastAttemptedAt: now,
          lastRetrievedAt: now,
          nextAttemptAt: new Date(now.getTime() + DAY_MS),
          consecutiveFailures: 0,
          retrievalStatus: outcome.status,
          lastRetrievalError: null,
          providerAccountId: outcome.providerAccountId,
        }
      : {
          lastAttemptedAt: now,
          nextAttemptAt: new Date(now.getTime() + DAY_MS),
          consecutiveFailures: { increment: 1 },
          retrievalStatus: outcome.status,
          lastRetrievalError: outcome.errorMessage ?? outcome.errorCode,
          providerAccountId: outcome.providerAccountId ?? undefined,
        },
  });
}

async function markRunAndAccountsFailed(
  tx: Prisma.TransactionClient,
  runId: string,
  providerRun: ApifyRun,
  error: Error,
  accountIds: string[],
  now: Date
): Promise<void> {
  await tx.monitorRunAccount.updateMany({
    where: { runId },
    data: {
      status: "FAILED",
      errorCode: "invalid_provider_result",
      errorMessage: error.message,
      completedAt: now,
    },
  });
  await tx.monitorRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      externalDatasetId: providerRun.defaultDatasetId ?? null,
      providerSchemaVersion: APIFY_DETAILS_PARSER_VERSION,
      errorSummary: error.message,
      retrievedAt: now,
    },
  });
  await tx.watchedAccount.updateMany({
    where: { id: { in: accountIds } },
    data: {
      lastAttemptedAt: now,
      nextAttemptAt: new Date(now.getTime() + DAY_MS),
      consecutiveFailures: { increment: 1 },
      retrievalStatus: "FAILED",
      lastRetrievalError: error.message,
    },
  });
}

function resolveRunStatus(
  outcomes: NormalizedAccountOutcome[],
  accountsRetrieved: number
): MonitorRunStatus {
  if (accountsRetrieved === 0) return "FAILED";
  const hasDegradedOutcome = outcomes.some(
    (outcome) =>
      outcome.status === "FAILED" ||
      outcome.status === "NOT_FOUND" ||
      outcome.status === "PRIVATE" ||
      outcome.status === "FALLBACK_REQUIRED"
  );
  return hasDegradedOutcome ? "PARTIAL" : "RETRIEVED";
}

function summarizeOutcomeErrors(
  outcomes: NormalizedAccountOutcome[]
): string | null {
  const errors = outcomes
    .filter((outcome) => outcome.errorMessage || outcome.fallbackReasons.length)
    .map((outcome) => {
      const detail =
        outcome.errorMessage ?? outcome.fallbackReasons.join(",");
      return `@${outcome.handle}: ${detail}`;
    });
  return errors.length ? errors.join("; ") : null;
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
