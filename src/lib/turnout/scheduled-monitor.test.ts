import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";

import type { ApifyMonitorProvider } from "./apify-client";
import {
  isAuthorizedCronRequest,
  runScheduledTurnout,
} from "./scheduled-monitor";

test("cron authorization fails closed without an exact configured secret", () => {
  assert.equal(isAuthorizedCronRequest("Bearer secret", undefined), false);
  assert.equal(isAuthorizedCronRequest(null, "secret"), false);
  assert.equal(isAuthorizedCronRequest("Bearer wrong", "secret"), false);
  assert.equal(isAuthorizedCronRequest("Bearer secret", "secret"), true);
});

test("scheduled orchestration reconciles before starting the daily monitor", async () => {
  const calls: string[] = [];
  const now = new Date("2026-07-30T08:00:00.000Z");
  const reconciliation = {
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
  const monitor = {
    disposition: "started" as const,
    runId: "scheduled-run",
    externalRunId: "provider-run",
    handles: ["turnout_fixture"],
    retrievalWindowStart: new Date("2026-07-27T08:00:00.000Z"),
    retrievalWindowEnd: now,
  };

  const result = await runScheduledTurnout({
    prisma: {} as PrismaClient,
    provider: {} as ApifyMonitorProvider,
    webhook: { requestUrl: "https://example.com/webhook", secret: "secret" },
    now,
    reconcile: async (options) => {
      calls.push("reconcile");
      assert.equal(options.budgetMs, 25_000);
      assert.equal(options.now, now);
      return reconciliation;
    },
    startMonitor: async (options) => {
      calls.push("start");
      assert.equal(options.now, now);
      return monitor;
    },
  });

  assert.deepEqual(calls, ["reconcile", "start"]);
  assert.deepEqual(result, { reconciliation, monitor });
});
