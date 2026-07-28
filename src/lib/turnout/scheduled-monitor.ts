import { PrismaClient } from "@prisma/client";

import {
  type ApifyMonitorProvider,
  type ApifyWebhookConfig,
} from "./apify-client";
import {
  reconcileTurnout,
  type ReconciliationSummary,
} from "./reconcile";
import {
  startScheduledMonitorRun,
  type MonitorRunStartResult,
} from "./start-monitor-run";

const CRON_RECONCILIATION_BUDGET_MS = 25_000;

export interface RunScheduledTurnoutOptions {
  prisma: PrismaClient;
  provider: ApifyMonitorProvider;
  webhook: ApifyWebhookConfig;
  now?: Date;
  reconcile?: typeof reconcileTurnout;
  startMonitor?: typeof startScheduledMonitorRun;
}

export interface ScheduledTurnoutSummary {
  reconciliation: ReconciliationSummary;
  monitor: MonitorRunStartResult;
}

export async function runScheduledTurnout(
  options: RunScheduledTurnoutOptions
): Promise<ScheduledTurnoutSummary> {
  const now = options.now ?? new Date();
  const reconcile = options.reconcile ?? reconcileTurnout;
  const startMonitor = options.startMonitor ?? startScheduledMonitorRun;
  const reconciliation = await reconcile({
    prisma: options.prisma,
    provider: options.provider,
    webhook: options.webhook,
    now,
    budgetMs: CRON_RECONCILIATION_BUDGET_MS,
  });
  const monitor = await startMonitor({
    prisma: options.prisma,
    provider: options.provider,
    webhook: options.webhook,
    now,
  });

  return { reconciliation, monitor };
}

export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  secret: string | undefined
): boolean {
  return Boolean(secret && authorizationHeader === `Bearer ${secret}`);
}
