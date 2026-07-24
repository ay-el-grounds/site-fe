import { MonitorRunTrigger, PrismaClient } from "@prisma/client";

import {
  ApifyClient,
  type ApifyWebhookConfig,
} from "./apify-client";
import { computeRetrievalWindow } from "./apify-details";

export interface StartMonitorRunOptions {
  prisma: PrismaClient;
  provider: ApifyClient;
  handles?: string[];
  trigger?: MonitorRunTrigger;
  webhook?: ApifyWebhookConfig;
  now?: Date;
}

export async function startMonitorRun(options: StartMonitorRunOptions) {
  const now = options.now ?? new Date();
  const normalizedHandles = options.handles?.map(normalizeHandle);
  const accounts = await options.prisma.watchedAccount.findMany({
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
  const lastCompletedRetrievalAt =
    successfulRetrievals.length === accounts.length
      ? new Date(
          Math.min(...successfulRetrievals.map((value) => value.getTime()))
        )
      : null;
  const window = computeRetrievalWindow({
    now,
    lastCompletedRetrievalAt,
  });

  const run = await options.prisma.monitorRun.create({
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

  try {
    const providerRun = await options.provider.startDetailsRun(
      accounts.map((account) => profileUrl(account.handle)),
      options.webhook
    );
    await options.prisma.monitorRun.update({
      where: { id: run.id },
      data: {
        externalRunId: providerRun.id,
        status: "RETRIEVING",
      },
    });

    return {
      runId: run.id,
      externalRunId: providerRun.id,
      handles: accounts.map((account) => account.handle),
      retrievalWindowStart: window.start,
      retrievalWindowEnd: window.end,
    };
  } catch (error) {
    await options.prisma.monitorRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorSummary: error instanceof Error ? error.message : String(error),
        retrievedAt: new Date(),
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
