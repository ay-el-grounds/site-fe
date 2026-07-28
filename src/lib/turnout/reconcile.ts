import { MonitorRunStatus, PrismaClient } from "@prisma/client";

import type { ApifyReconciliationProvider, ApifyWebhookConfig } from "./apify-client";
import {
  classifyPendingPosts,
  type ClassificationSummary,
  type PostClassifier,
} from "./classify-pending";
import { ingestApifyRun } from "./ingest-apify-run";

const DEFAULT_BUDGET_MS = 48_000;
const RECOVERY_GRACE_MS = 5 * 60 * 1000;
const CLASSIFICATION_BATCH_SIZE = 3;
const MAX_RECOVERIES_PER_INVOCATION = 5;
const MAX_FALLBACK_ACCOUNTS_PER_RUN = 32;
const MAX_CLASSIFICATION_RUNS = 12;
const MAX_POSTS_PER_INVOCATION = 12;
const MAX_ATTEMPTS = 3;

const TERMINAL_PROVIDER_STATUSES = new Set([
  "SUCCEEDED",
  "FAILED",
  "ABORTED",
  "TIMED-OUT",
]);

export interface ReconcileTurnoutOptions {
  prisma: PrismaClient;
  provider: ApifyReconciliationProvider;
  webhook: ApifyWebhookConfig;
  now?: Date;
  budgetMs?: number;
  classifier?: PostClassifier;
  runIds?: string[];
}

export interface ReconciliationSummary {
  accepted: boolean;
  recoveredRuns: number;
  fallbacksStarted: number;
  fallbacksIngested: number;
  leasesReclaimed: number;
  postsClaimed: number;
  postsProcessed: number;
  eventsCreated: number;
  runsFinalized: number;
  errors: string[];
}

interface FallbackClaim {
  runId: string;
  profileUrls: string[];
  retrievalWindowStart: Date;
}

export async function reconcileTurnout(
  options: ReconcileTurnoutOptions
): Promise<ReconciliationSummary> {
  const startedAt = Date.now();
  const now = options.now ?? new Date();
  const deadline = startedAt + (options.budgetMs ?? DEFAULT_BUDGET_MS);
  const summary = emptySummary();

  const acquired = await tryAcquirePlanningLock(options.prisma);
  if (!acquired) {
    summary.accepted = false;
    return summary;
  }

  await recoverMissedCallbacks(options, summary, now, deadline);
  if (hasTime(deadline)) {
    summary.leasesReclaimed = await reclaimExpiredLeases(
      options.prisma,
      now,
      options.runIds
    );
  }
  if (hasTime(deadline)) {
    await ingestCompletedFallbacks(options, summary, deadline);
  }
  if (hasTime(deadline)) {
    await startFallbackRun(options, summary, now);
  }
  if (hasTime(deadline)) {
    await drainClassification(options, summary, now, deadline);
  }
  if (hasTime(deadline)) {
    summary.runsFinalized = await finalizeRuns(
      options.prisma,
      now,
      options.runIds
    );
  }

  return summary;
}

async function tryAcquirePlanningLock(prisma: PrismaClient): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ acquired: boolean }>>`
      SELECT pg_try_advisory_xact_lock(
        hashtextextended('turnout-reconciliation', 0)
      ) AS acquired
    `;
    return rows[0]?.acquired ?? false;
  });
}

async function recoverMissedCallbacks(
  options: ReconcileTurnoutOptions,
  summary: ReconciliationSummary,
  now: Date,
  deadline: number
): Promise<void> {
  const staleBefore = new Date(now.getTime() - RECOVERY_GRACE_MS);
  const runs = await options.prisma.monitorRun.findMany({
    where: {
      status: { in: ["PENDING", "RETRIEVING"] },
      externalRunId: { not: null },
      updatedAt: { lt: staleBefore },
      accounts: { none: { retrievalSource: "POSTS_FALLBACK" } },
      ...(options.runIds ? { id: { in: options.runIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: MAX_RECOVERIES_PER_INVOCATION,
    select: { externalRunId: true },
  });

  for (const run of runs) {
    if (!hasTime(deadline) || !run.externalRunId) break;
    try {
      const providerRun = await options.provider.getRun(run.externalRunId);
      if (!TERMINAL_PROVIDER_STATUSES.has(providerRun.status)) continue;
      const ingestion = await ingestApifyRun({
        prisma: options.prisma,
        provider: options.provider,
        callbackRunId: run.externalRunId,
        now,
      });
      if (ingestion.disposition === "ingested") summary.recoveredRuns++;
    } catch (error) {
      summary.errors.push(formatError(`recover ${run.externalRunId}`, error));
    }
  }
}

async function ingestCompletedFallbacks(
  options: ReconcileTurnoutOptions,
  summary: ReconciliationSummary,
  deadline: number
): Promise<void> {
  const runs = await options.prisma.monitorRun.findMany({
    where: {
      status: { in: ["PENDING", "RETRIEVING"] },
      externalRunId: { not: null },
      accounts: { some: { retrievalSource: "POSTS_FALLBACK" } },
      ...(options.runIds ? { id: { in: options.runIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: MAX_RECOVERIES_PER_INVOCATION,
    select: { externalRunId: true },
  });

  for (const run of runs) {
    if (!hasTime(deadline) || !run.externalRunId) break;
    try {
      const providerRun = await options.provider.getRun(run.externalRunId);
      if (!TERMINAL_PROVIDER_STATUSES.has(providerRun.status)) continue;
      const ingestion = await ingestApifyRun({
        prisma: options.prisma,
        provider: options.provider,
        callbackRunId: run.externalRunId,
      });
      if (ingestion.disposition === "ingested") summary.fallbacksIngested++;
    } catch (error) {
      summary.errors.push(
        formatError(`ingest fallback ${run.externalRunId}`, error)
      );
    }
  }
}

async function reclaimExpiredLeases(
  prisma: PrismaClient,
  now: Date,
  runIds?: string[]
): Promise<number> {
  const runScope = runIds
    ? { account: { monitorRunAccounts: { some: { runId: { in: runIds } } } } }
    : {};
  return prisma.$transaction(async (tx) => {
    const exhausted = await tx.instagramPost.updateMany({
      where: {
        processingStatus: "PROCESSING",
        processingLeaseExpiresAt: { lt: now },
        processingAttempts: { gte: MAX_ATTEMPTS },
        ...runScope,
      },
      data: {
        processingStatus: "PERMANENT_ERROR",
        processingLeaseId: null,
        processingLeaseExpiresAt: null,
      },
    });
    const retryable = await tx.instagramPost.updateMany({
      where: {
        processingStatus: "PROCESSING",
        processingLeaseExpiresAt: { lt: now },
        processingAttempts: { lt: MAX_ATTEMPTS },
        ...runScope,
      },
      data: {
        processingStatus: "RETRYABLE_ERROR",
        processingLeaseId: null,
        processingLeaseExpiresAt: null,
      },
    });
    await tx.instagramPost.updateMany({
      where: {
        processingStatus: "RETRYABLE_ERROR",
        processingAttempts: { gte: MAX_ATTEMPTS },
        ...runScope,
      },
      data: { processingStatus: "PERMANENT_ERROR" },
    });
    return exhausted.count + retryable.count;
  });
}

async function startFallbackRun(
  options: ReconcileTurnoutOptions,
  summary: ReconciliationSummary,
  now: Date
): Promise<void> {
  await releaseAbandonedFallbackClaims(options.prisma, now, options.runIds);
  await releaseFailedFallbackLinks(options.prisma, options.runIds);
  const claim = await claimFallbackRun(options.prisma, now, options.runIds);
  if (!claim) return;

  try {
    const providerRun = await options.provider.startPostsRun(
      claim.profileUrls,
      claim.retrievalWindowStart,
      options.webhook
    );
    await options.prisma.monitorRun.update({
      where: { id: claim.runId },
      data: {
        externalRunId: providerRun.id,
        status: "RETRIEVING",
      },
    });
    summary.fallbacksStarted++;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await options.prisma.$transaction([
      options.prisma.monitorRun.update({
        where: { id: claim.runId },
        data: {
          status: "FAILED",
          errorSummary: message.slice(0, 2000),
          retrievedAt: now,
          completedAt: now,
        },
      }),
      options.prisma.monitorRunAccount.updateMany({
        where: { fallbackRunId: claim.runId },
        data: { fallbackRunId: null },
      }),
    ]);
    summary.errors.push(formatError(`start fallback ${claim.runId}`, error));
  }
}

async function releaseAbandonedFallbackClaims(
  prisma: PrismaClient,
  now: Date,
  runIds?: string[]
): Promise<void> {
  const staleBefore = new Date(now.getTime() - RECOVERY_GRACE_MS);
  const abandoned = await prisma.monitorRun.findMany({
    where: {
      status: "PENDING",
      externalRunId: null,
      updatedAt: { lt: staleBefore },
      accounts: { some: { retrievalSource: "POSTS_FALLBACK" } },
      fallbackForAccounts: {
        some: {
          needsFallback: true,
          ...(runIds ? { runId: { in: runIds } } : {}),
        },
      },
    },
    select: { id: true },
  });
  if (abandoned.length === 0) return;

  await prisma.$transaction([
    prisma.monitorRun.updateMany({
      where: { id: { in: abandoned.map((run) => run.id) } },
      data: {
        status: "FAILED",
        errorSummary: "Fallback provider start was not recorded; retrying",
        retrievedAt: now,
        completedAt: now,
      },
    }),
    prisma.monitorRunAccount.updateMany({
      where: {
        fallbackRunId: { in: abandoned.map((run) => run.id) },
        ...(runIds ? { runId: { in: runIds } } : {}),
      },
      data: { fallbackRunId: null },
    }),
  ]);
}

async function claimFallbackRun(
  prisma: PrismaClient,
  now: Date,
  runIds?: string[]
): Promise<FallbackClaim | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ acquired: boolean }>>`
      SELECT pg_try_advisory_xact_lock(
        hashtextextended('turnout-fallback-start', 0)
      ) AS acquired
    `;
    if (!rows[0]?.acquired) return null;

    const unresolved = await tx.monitorRunAccount.findMany({
      where: {
        needsFallback: true,
        fallbackRunId: null,
        ...(runIds ? { runId: { in: runIds } } : {}),
      },
      include: {
        run: {
          select: {
            retrievalWindowStart: true,
            retrievalWindowEnd: true,
          },
        },
      },
      orderBy: { startedAt: "asc" },
      take: MAX_FALLBACK_ACCOUNTS_PER_RUN,
    });
    if (unresolved.length === 0) return null;

    const retrievalWindowStart = new Date(
      Math.min(
        ...unresolved.map((outcome) => outcome.run.retrievalWindowStart.getTime())
      )
    );
    const retrievalWindowEnd = new Date(
      Math.max(
        now.getTime(),
        ...unresolved.map((outcome) => outcome.run.retrievalWindowEnd.getTime())
      )
    );
    const fallback = await tx.monitorRun.create({
      data: {
        trigger: "RECONCILIATION",
        status: "PENDING",
        retrievalWindowStart,
        retrievalWindowEnd,
        accountsRequested: unresolved.length,
        accounts: {
          create: unresolved.map((outcome) => ({
            accountId: outcome.accountId,
            providerInputUrl: outcome.providerInputUrl,
            retrievalSource: "POSTS_FALLBACK",
          })),
        },
      },
    });
    await tx.monitorRunAccount.updateMany({
      where: { id: { in: unresolved.map((outcome) => outcome.id) } },
      data: { fallbackRunId: fallback.id },
    });

    return {
      runId: fallback.id,
      profileUrls: unresolved.map((outcome) => outcome.providerInputUrl),
      retrievalWindowStart,
    };
  });
}

async function releaseFailedFallbackLinks(
  prisma: PrismaClient,
  runIds?: string[]
): Promise<void> {
  const failed = await prisma.monitorRun.findMany({
    where: {
      status: "FAILED",
      fallbackForAccounts: { some: { needsFallback: true } },
    },
    select: { id: true },
  });
  if (failed.length === 0) return;
  await prisma.monitorRunAccount.updateMany({
    where: {
      needsFallback: true,
      fallbackRunId: { in: failed.map((run) => run.id) },
      ...(runIds ? { runId: { in: runIds } } : {}),
    },
    data: { fallbackRunId: null },
  });
}

async function drainClassification(
  options: ReconcileTurnoutOptions,
  summary: ReconciliationSummary,
  now: Date,
  deadline: number
): Promise<void> {
  const runs = await options.prisma.monitorRun.findMany({
    where: {
      status: { in: ["RETRIEVED", "PROCESSING", "PARTIAL"] },
      postsRetrieved: { gt: 0 },
      ...(options.runIds ? { id: { in: options.runIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: MAX_CLASSIFICATION_RUNS,
    select: { id: true },
  });

  let claimedInPass = 1;
  while (
    claimedInPass > 0 &&
    summary.postsClaimed < MAX_POSTS_PER_INVOCATION &&
    hasTime(deadline, 12_000)
  ) {
    claimedInPass = 0;
    for (const run of runs) {
      if (
        !hasTime(deadline, 12_000) ||
        summary.postsClaimed >= MAX_POSTS_PER_INVOCATION
      ) {
        break;
      }
      try {
        const remainingLimit = Math.min(
          CLASSIFICATION_BATCH_SIZE,
          MAX_POSTS_PER_INVOCATION - summary.postsClaimed
        );
        const batch = await classifyPendingPosts({
          prisma: options.prisma,
          runId: run.id,
          limit: remainingLimit,
          now,
          classifier: options.classifier,
        });
        addClassification(summary, batch);
        claimedInPass += batch.claimed;
      } catch (error) {
        summary.errors.push(formatError(`classify ${run.id}`, error));
      }
    }
  }
}

async function finalizeRuns(
  prisma: PrismaClient,
  now: Date,
  runIds?: string[]
): Promise<number> {
  const runs = await prisma.monitorRun.findMany({
    where: {
      status: { in: ["RETRIEVED", "PROCESSING", "PARTIAL"] },
      ...(runIds ? { id: { in: runIds } } : {}),
    },
    include: { accounts: true },
    orderBy: { createdAt: "asc" },
  });
  let finalized = 0;

  for (const run of runs) {
    const unresolvedFallback = run.accounts.some(
      (account) => account.needsFallback
    );
    const pendingAccount = run.accounts.some(
      (account) => account.status === "PENDING"
    );
    const remaining = await countRemainingPosts(prisma, run.id, run.retrievalWindowStart);
    const hasAccountFailure = run.accounts.some((account) =>
      ["NOT_FOUND", "PRIVATE", "FAILED"].includes(account.status)
    );

    let status: MonitorRunStatus;
    let completedAt: Date | null = null;
    if (pendingAccount) {
      continue;
    } else if (unresolvedFallback || remaining > 0) {
      status = unresolvedFallback || hasAccountFailure ? "PARTIAL" : "PROCESSING";
    } else {
      status = hasAccountFailure ? "PARTIAL" : "COMPLETED";
      completedAt = run.completedAt ?? now;
    }

    if (
      run.status !== status ||
      run.completedAt?.getTime() !== completedAt?.getTime()
    ) {
      await prisma.monitorRun.update({
        where: { id: run.id },
        data: { status, completedAt },
      });
      if (completedAt && !run.completedAt) finalized++;
    }
  }
  return finalized;
}

async function countRemainingPosts(
  prisma: PrismaClient,
  runId: string,
  retrievalWindowStart: Date
): Promise<number> {
  return prisma.instagramPost.count({
    where: {
      account: { monitorRunAccounts: { some: { runId } } },
      OR: [
        { publishedAt: null },
        { publishedAt: { gte: retrievalWindowStart } },
      ],
      processingStatus: {
        in: ["PENDING", "PROCESSING", "RETRYABLE_ERROR"],
      },
    },
  });
}

function addClassification(
  summary: ReconciliationSummary,
  batch: ClassificationSummary
): void {
  summary.postsClaimed += batch.claimed;
  summary.postsProcessed += batch.processed;
  summary.eventsCreated += batch.eventsCreated;
}

function emptySummary(): ReconciliationSummary {
  return {
    accepted: true,
    recoveredRuns: 0,
    fallbacksStarted: 0,
    fallbacksIngested: 0,
    leasesReclaimed: 0,
    postsClaimed: 0,
    postsProcessed: 0,
    eventsCreated: 0,
    runsFinalized: 0,
    errors: [],
  };
}

function hasTime(deadline: number, reserveMs = 5_000): boolean {
  return Date.now() < deadline - reserveMs;
}

function formatError(context: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `${context}: ${message}`.slice(0, 2000);
}
