import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

import type {
  ApifyMonitorProvider,
  ApifyRun,
  ApifyWebhookConfig,
} from "./apify-client";
import { startScheduledMonitorRun } from "./start-monitor-run";

config({ path: ".env.local" });

const integrationTest =
  process.env.TURNOUT_DATABASE_INTEGRATION === "1" ? test : test.skip;
const prisma = new PrismaClient();
const createdAccountIds = new Set<string>();
const createdRunIds = new Set<string>();
const webhook: ApifyWebhookConfig = {
  requestUrl: "https://example.com/api/webhooks/apify",
  secret: "test-secret",
};

test.after(async () => {
  if (createdRunIds.size) {
    await prisma.monitorRun.deleteMany({
      where: { id: { in: [...createdRunIds] } },
    });
  }
  if (createdAccountIds.size) {
    await prisma.watchedAccount.deleteMany({
      where: { id: { in: [...createdAccountIds] } },
    });
  }
  await prisma.$disconnect();
});

integrationTest("concurrent daily starts submit exactly one provider run", async () => {
  const handle = await createAccount();
  const now = new Date("2035-04-18T08:00:00.000Z");
  const provider = fakeProvider();

  const [first, second] = await Promise.all([
    startScheduledMonitorRun({ prisma, provider, handles: [handle], webhook, now }),
    startScheduledMonitorRun({ prisma, provider, handles: [handle], webhook, now }),
  ]);
  createdRunIds.add(first.runId);
  createdRunIds.add(second.runId);

  assert.equal(provider.detailsStarts(), 1);
  assert.deepEqual(
    [first.disposition, second.disposition].sort(),
    ["already_started", "started"]
  );
  assert.equal(first.runId, second.runId);
});

integrationTest("a failed provider submission can be retried the same day", async () => {
  const handle = await createAccount();
  const now = new Date("2035-04-19T08:00:00.000Z");
  const failingProvider = fakeProvider(true);

  await assert.rejects(
    startScheduledMonitorRun({
      prisma,
      provider: failingProvider,
      handles: [handle],
      webhook,
      now,
    }),
    /fixture provider start failed/
  );
  const failed = await prisma.monitorRun.findFirstOrThrow({
    where: {
      trigger: "SCHEDULED",
      retrievalWindowEnd: now,
      accounts: { some: { account: { handle } } },
    },
    orderBy: { createdAt: "desc" },
  });
  createdRunIds.add(failed.id);
  assert.equal(failed.status, "FAILED");

  const retryProvider = fakeProvider();
  const retried = await startScheduledMonitorRun({
    prisma,
    provider: retryProvider,
    handles: [handle],
    webhook,
    now,
  });
  createdRunIds.add(retried.runId);

  assert.equal(retried.disposition, "started");
  assert.notEqual(retried.runId, failed.id);
  assert.equal(retryProvider.detailsStarts(), 1);
});

async function createAccount(): Promise<string> {
  const handle = `turnout_test_scheduled_${randomUUID().replaceAll("-", "")}`;
  const account = await prisma.watchedAccount.create({
    data: { handle, displayName: "Turnout scheduled test" },
  });
  createdAccountIds.add(account.id);
  return handle;
}

function fakeProvider(failDetails = false): ApifyMonitorProvider & {
  detailsStarts(): number;
} {
  let starts = 0;
  return {
    detailsStarts: () => starts,
    async startDetailsRun() {
      starts++;
      if (failDetails) throw new Error("fixture provider start failed");
      return providerRun(`scheduled-provider-${randomUUID()}`);
    },
    async startPostsRun() {
      throw new Error("Posts fallback was not expected");
    },
    async getRun(runId) {
      return providerRun(runId);
    },
    async getDatasetItems() {
      return [];
    },
  };
}

function providerRun(id: string): ApifyRun {
  return {
    id,
    actId: "apify/instagram-scraper",
    status: "RUNNING",
    defaultDatasetId: `dataset-${id}`,
  };
}
