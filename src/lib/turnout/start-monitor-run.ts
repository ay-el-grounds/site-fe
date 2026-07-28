import { MonitorRunTrigger, PrismaClient } from "@prisma/client";

import {
  type ApifyMonitorProvider,
  type ApifyWebhookConfig,
} from "./apify-client";
import { computeRetrievalWindow } from "./apify-details";

export interface StartMonitorRunOptions {
  prisma: PrismaClient;
  provider: ApifyMonitorProvider;
  handles?: string[];
  trigger?: MonitorRunTrigger;
  webhook?: ApifyWebhookConfig;
  now?: Date;
}

export interface StartedMonitorRunResult {
  disposition: "started";
  runId: string;
  externalRunId: string;
  handles: string[];
  retrievalWindowStart: Date;
  retrievalWindowEnd: Date;
}

export interface ExistingMonitorRunResult {
  disposition: "already_started";
  runId: string;
  externalRunId: string | null;
  handles: string[];
  retrievalWindowStart: Date;
  retrievalWindowEnd: Date;
}

export type MonitorRunStartResult =
  | StartedMonitorRunResult
  | ExistingMonitorRunResult;

type MonitorRunStore = Pick<PrismaClient, "watchedAccount" | "monitorRun">;

interface PreparedMonitorRun {
  runId: string;
  handles: string[];
  profileUrls: string[];
  retrievalWindowStart: Date;
  retrievalWindowEnd: Date;
}

export async function startMonitorRun(
  options: StartMonitorRunOptions
): Promise<StartedMonitorRunResult> {
  const prepared = await createMonitorRunRecord(options.prisma, options);
  return launchMonitorRun(options, prepared);
}

export async function startScheduledMonitorRun(
  options: Omit<StartMonitorRunOptions, "trigger">
): Promise<MonitorRunStartResult> {
  const now = options.now ?? new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const claim = await options.prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      WITH scheduled_start_lock AS (
        SELECT pg_advisory_xact_lock(
          hashtextextended('turnout-scheduled-monitor-start', 0)
        )
      )
      SELECT true AS acquired
      FROM scheduled_start_lock
    `;

    const existing = await tx.monitorRun.findFirst({
      where: {
        trigger: "SCHEDULED",
        status: { not: "FAILED" },
        retrievalWindowEnd: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { createdAt: "asc" },
      include: {
        accounts: {
          include: { account: { select: { handle: true } } },
          orderBy: { account: { handle: "asc" } },
        },
      },
    });

    if (existing) {
      return {
        existing: true as const,
        result: {
          disposition: "already_started" as const,
          runId: existing.id,
          externalRunId: existing.externalRunId,
          handles: existing.accounts.map((item) => item.account.handle),
          retrievalWindowStart: existing.retrievalWindowStart,
          retrievalWindowEnd: existing.retrievalWindowEnd,
        },
      };
    }

    const prepared = await createMonitorRunRecord(tx, {
      ...options,
      trigger: "SCHEDULED",
      now,
    });
    return { existing: false as const, prepared };
  });

  if (claim.existing) return claim.result;
  return launchMonitorRun(
    { ...options, trigger: "SCHEDULED", now },
    claim.prepared
  );
}

async function createMonitorRunRecord(
  store: MonitorRunStore,
  options: Omit<StartMonitorRunOptions, "prisma"> | StartMonitorRunOptions
): Promise<PreparedMonitorRun> {
  const now = options.now ?? new Date();
  const normalizedHandles = options.handles?.map(normalizeHandle);
  const accounts = await store.watchedAccount.findMany({
    where: {
      isActive: true,
      ...(normalizedHandles ? { handle: { in: normalizedHandles } } : {}),
    },
    orderBy: { handle: "asc" },
  });

  if (normalizedHandles && accounts.length !== normalizedHandles.length) {
    const found = new Set(accounts.map((account) => account.handle));
    const missing = normalizedHandles.filter((handle) => !found.has(handle));
    throw new Error(`Active watched accounts not found: ${missing.join(", ")}`);
  }
  if (accounts.length === 0) {
    throw new Error("No active watched accounts are available for monitoring");
  }

  const successfulRetrievals = accounts
    .map((account) => account.lastRetrievedAt)
    .filter((value): value is Date => value !== null);
  const hasNeverAttemptedAccount = accounts.some(
    (account) => account.lastAttemptedAt === null
  );
  const lastCompletedRetrievalAt =
    !hasNeverAttemptedAccount && successfulRetrievals.length > 0
      ? new Date(
          Math.min(...successfulRetrievals.map((value) => value.getTime()))
        )
      : null;
  const window = computeRetrievalWindow({
    now,
    lastCompletedRetrievalAt,
  });

  const profileUrls = accounts.map((account) => profileUrl(account.handle));
  const run = await store.monitorRun.create({
    data: {
      trigger: options.trigger ?? "MANUAL",
      status: "PENDING",
      retrievalWindowStart: window.start,
      retrievalWindowEnd: window.end,
      accountsRequested: accounts.length,
      accounts: {
        create: accounts.map((account) => ({
          accountId: account.id,
          providerInputUrl: profileUrl(account.handle),
          retrievalSource: window.isHistoricalBackfill
            ? "HISTORICAL_BACKFILL"
            : "DETAILS_PRIMARY",
        })),
      },
    },
  });

  return {
    runId: run.id,
    handles: accounts.map((account) => account.handle),
    profileUrls,
    retrievalWindowStart: window.start,
    retrievalWindowEnd: window.end,
  };
}

async function launchMonitorRun(
  options: StartMonitorRunOptions,
  prepared: PreparedMonitorRun
): Promise<StartedMonitorRunResult> {
  try {
    const providerRun = await options.provider.startDetailsRun(
      prepared.profileUrls,
      options.webhook
    );
    await options.prisma.monitorRun.update({
      where: { id: prepared.runId },
      data: {
        externalRunId: providerRun.id,
        status: "RETRIEVING",
      },
    });

    return {
      disposition: "started",
      runId: prepared.runId,
      externalRunId: providerRun.id,
      handles: prepared.handles,
      retrievalWindowStart: prepared.retrievalWindowStart,
      retrievalWindowEnd: prepared.retrievalWindowEnd,
    };
  } catch (error) {
    await options.prisma.monitorRun.update({
      where: { id: prepared.runId },
      data: {
        status: "FAILED",
        errorSummary: error instanceof Error ? error.message : String(error),
        retrievedAt: options.now ?? new Date(),
        completedAt: options.now ?? new Date(),
      },
    });
    throw error;
  }
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function profileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}
