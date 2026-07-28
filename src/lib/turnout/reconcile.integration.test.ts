import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

import type {
  ApifyReconciliationProvider,
  ApifyRun,
  ApifyWebhookConfig,
} from "./apify-client";
import { ingestApifyRun } from "./ingest-apify-run";
import { reconcileTurnout } from "./reconcile";

config({ path: ".env.local" });

const integrationTest =
  process.env.TURNOUT_DATABASE_INTEGRATION === "1" ? test : test.skip;
const prisma = new PrismaClient();
const NOW = new Date("2026-07-29T04:00:00.000Z");
const WINDOW_START = new Date("2026-07-26T04:00:00.000Z");
const WEBHOOK: ApifyWebhookConfig = {
  requestUrl: "https://example.com/api/webhooks/apify",
  secret: "test-secret",
};
const createdAccountIds = new Set<string>();
const createdRunIds = new Set<string>();

test.after(async () => {
  if (createdRunIds.size) {
    await prisma.monitorRun.deleteMany({
      where: { id: { in: [...createdRunIds] } },
    });
  }
  if (createdAccountIds.size) {
    await prisma.instagramPost.deleteMany({
      where: { accountId: { in: [...createdAccountIds] } },
    });
    await prisma.watchedAccount.deleteMany({
      where: { id: { in: [...createdAccountIds] } },
    });
  }
  await prisma.$disconnect();
});

integrationTest("recovers a missed callback and drains its post to completion", async () => {
  const scenario = await createPrimaryRun("PENDING");
  const provider = fakeProvider({
    [scenario.externalRunId]: {
      items: [detailsItem(scenario.handle, [postItem("RecoveredPost", scenario.handle)])],
    },
  });

  const summary = await reconcileTurnout({
    prisma,
    provider,
    webhook: WEBHOOK,
    now: NOW,
    runIds: [scenario.runId],
    classifier: async () => null,
  });
  const run = await prisma.monitorRun.findUniqueOrThrow({
    where: { id: scenario.runId },
  });

  assert.equal(summary.recoveredRuns, 1);
  assert.equal(summary.postsProcessed, 1);
  assert.equal(run.status, "COMPLETED");
  assert.ok(run.completedAt);
});

integrationTest("launches, ingests, and exactly replays a posts fallback", async () => {
  const scenario = await createPrimaryRun("PARTIAL", {
    accountStatus: "FALLBACK_REQUIRED",
    needsFallback: true,
    fallbackReason: "LATEST_POSTS_TRUNCATED",
  });
  const fallbackExternalRunId = `fallback-provider-${randomUUID()}`;
  const starter = fakeProvider({}, fallbackExternalRunId);

  const started = await reconcileTurnout({
    prisma,
    provider: starter,
    webhook: WEBHOOK,
    now: NOW,
    runIds: [scenario.runId],
    classifier: async () => null,
  });
  const primaryOutcome = await prisma.monitorRunAccount.findUniqueOrThrow({
    where: {
      runId_accountId: {
        runId: scenario.runId,
        accountId: scenario.accountId,
      },
    },
  });
  assert.equal(started.fallbacksStarted, 1);
  assert.ok(primaryOutcome.fallbackRunId);
  createdRunIds.add(primaryOutcome.fallbackRunId);

  const fallbackProvider = fakeProvider({
    [fallbackExternalRunId]: {
      items: [postsItem("FallbackRecovered", scenario.handle)],
    },
  });
  const ingested = await reconcileTurnout({
    prisma,
    provider: fallbackProvider,
    webhook: WEBHOOK,
    now: new Date(NOW.getTime() + 60_000),
    runIds: [scenario.runId, primaryOutcome.fallbackRunId],
    classifier: async () => null,
  });
  const resolved = await prisma.monitorRunAccount.findUniqueOrThrow({
    where: {
      runId_accountId: {
        runId: scenario.runId,
        accountId: scenario.accountId,
      },
    },
  });
  const storedPost = await prisma.instagramPost.findUniqueOrThrow({
    where: {
      accountId_shortcode: {
        accountId: scenario.accountId,
        shortcode: "FallbackRecovered",
      },
    },
  });
  const replay = await ingestApifyRun({
    prisma,
    provider: fallbackProvider,
    callbackRunId: fallbackExternalRunId,
    now: new Date(NOW.getTime() + 120_000),
  });

  assert.equal(ingested.fallbacksIngested, 1);
  assert.equal(resolved.needsFallback, false);
  assert.equal(resolved.status, "RETRIEVED");
  assert.equal(storedPost.accountId, scenario.accountId);
  assert.equal(storedPost.processingStatus, "NON_EVENT");
  assert.equal(replay.disposition, "already_ingested");
  assert.equal(
    await prisma.instagramPost.count({
      where: { accountId: scenario.accountId, shortcode: "FallbackRecovered" },
    }),
    1
  );
});

integrationTest("reclaims an expired lease and resumes classification", async () => {
  const scenario = await createPrimaryRun("PROCESSING", {
    accountStatus: "RETRIEVED",
    postsRetrieved: 1,
    runPostsRetrieved: 1,
  });
  await createLeasedPost(scenario.accountId, "ExpiredLease", {
    expiresAt: new Date(NOW.getTime() - 60_000),
    attempts: 1,
  });

  const summary = await reconcileTurnout({
    prisma,
    provider: fakeProvider({}),
    webhook: WEBHOOK,
    now: NOW,
    runIds: [scenario.runId],
    classifier: async () => null,
  });
  const post = await prisma.instagramPost.findUniqueOrThrow({
    where: {
      accountId_shortcode: {
        accountId: scenario.accountId,
        shortcode: "ExpiredLease",
      },
    },
  });

  assert.equal(summary.leasesReclaimed, 1);
  assert.equal(summary.postsProcessed, 1);
  assert.equal(post.processingStatus, "NON_EVENT");
  assert.equal(post.processingAttempts, 2);
});

integrationTest("does not steal active leases and makes exhausted leases terminal", async () => {
  const active = await createPrimaryRun("PROCESSING", {
    accountStatus: "RETRIEVED",
    postsRetrieved: 1,
    runPostsRetrieved: 1,
  });
  await createLeasedPost(active.accountId, "ActiveLease", {
    expiresAt: new Date(NOW.getTime() + 60_000),
    attempts: 1,
  });
  const exhausted = await createPrimaryRun("PROCESSING", {
    accountStatus: "RETRIEVED",
    postsRetrieved: 1,
    runPostsRetrieved: 1,
  });
  await createLeasedPost(exhausted.accountId, "ExhaustedLease", {
    expiresAt: new Date(NOW.getTime() - 60_000),
    attempts: 3,
  });

  const summary = await reconcileTurnout({
    prisma,
    provider: fakeProvider({}),
    webhook: WEBHOOK,
    now: NOW,
    runIds: [active.runId, exhausted.runId],
    classifier: async () => {
      throw new Error("active lease must not be classified");
    },
  });
  const [activePost, exhaustedPost] = await Promise.all([
    prisma.instagramPost.findUniqueOrThrow({
      where: {
        accountId_shortcode: {
          accountId: active.accountId,
          shortcode: "ActiveLease",
        },
      },
    }),
    prisma.instagramPost.findUniqueOrThrow({
      where: {
        accountId_shortcode: {
          accountId: exhausted.accountId,
          shortcode: "ExhaustedLease",
        },
      },
    }),
  ]);

  assert.equal(summary.leasesReclaimed, 1);
  assert.equal(summary.postsClaimed, 0);
  assert.equal(activePost.processingStatus, "PROCESSING");
  assert.equal(exhaustedPost.processingStatus, "PERMANENT_ERROR");
});

async function createPrimaryRun(
  status: "PENDING" | "PARTIAL" | "PROCESSING",
  options: {
    accountStatus?: "PENDING" | "RETRIEVED" | "FALLBACK_REQUIRED";
    needsFallback?: boolean;
    fallbackReason?: string;
    postsRetrieved?: number;
    runPostsRetrieved?: number;
  } = {}
) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const handle = `turnout_reconcile_${suffix}`;
  const account = await prisma.watchedAccount.create({
    data: { handle, isActive: false },
  });
  createdAccountIds.add(account.id);
  const externalRunId = `reconcile-provider-${randomUUID()}`;
  const run = await prisma.monitorRun.create({
    data: {
      trigger: "MANUAL",
      status,
      externalRunId,
      retrievalWindowStart: WINDOW_START,
      retrievalWindowEnd: NOW,
      accountsRequested: 1,
      postsRetrieved: options.runPostsRetrieved ?? 0,
      accounts: {
        create: {
          accountId: account.id,
          providerInputUrl: profileUrl(handle),
          status: options.accountStatus ?? "PENDING",
          needsFallback: options.needsFallback ?? false,
          fallbackReason: options.fallbackReason,
          postsRetrieved: options.postsRetrieved ?? 0,
          completedAt:
            options.accountStatus && options.accountStatus !== "PENDING"
              ? NOW
              : null,
        },
      },
    },
  });
  createdRunIds.add(run.id);
  return {
    runId: run.id,
    externalRunId,
    accountId: account.id,
    handle,
  };
}

async function createLeasedPost(
  accountId: string,
  shortcode: string,
  lease: { expiresAt: Date; attempts: number }
) {
  return prisma.instagramPost.create({
    data: {
      accountId,
      providerPostId: `provider-${shortcode}`,
      shortcode,
      canonicalUrl: `https://www.instagram.com/p/${shortcode}/`,
      caption: `Caption for ${shortcode}`,
      publishedAt: NOW,
      providerSchemaVersion: "integration-test",
      processingStatus: "PROCESSING",
      processingAttempts: lease.attempts,
      processingLeaseId: randomUUID(),
      processingLeaseExpiresAt: lease.expiresAt,
    },
  });
}

function fakeProvider(
  runs: Record<string, { items: unknown[]; status?: string }>,
  startedRunId = `unused-start-${randomUUID()}`
): ApifyReconciliationProvider {
  return {
    getRun: async (runId) => {
      const fixture = runs[runId];
      if (!fixture) throw new Error(`Unexpected provider run ${runId}`);
      return providerRun(runId, fixture.status ?? "SUCCEEDED");
    },
    getDatasetItems: async (datasetId) => {
      const runId = datasetId.replace(/^dataset-/, "");
      const fixture = runs[runId];
      if (!fixture) throw new Error(`Unexpected dataset ${datasetId}`);
      return fixture.items;
    },
    startPostsRun: async () => providerRun(startedRunId, "READY"),
  };
}

function providerRun(runId: string, status: string): ApifyRun {
  return {
    id: runId,
    actId: "apify-instagram-scraper",
    status,
    defaultDatasetId: `dataset-${runId}`,
  };
}

function detailsItem(handle: string, latestPosts: unknown[]) {
  return {
    inputUrl: profileUrl(handle),
    username: handle,
    id: `profile-${handle}`,
    private: false,
    latestPosts,
  };
}

function postItem(shortcode: string, handle: string) {
  return {
    id: `provider-${shortcode}`,
    shortCode: shortcode,
    url: `https://www.instagram.com/p/${shortcode}/`,
    caption: `Caption for ${shortcode}`,
    timestamp: NOW.toISOString(),
    ownerUsername: handle,
    displayUrl: `https://example.com/${shortcode}.jpg`,
    images: [],
    childPosts: [],
    type: "Image",
    productType: "feed",
    isPinned: false,
  };
}

function postsItem(shortcode: string, handle: string) {
  return {
    ...postItem(shortcode, "collaborative_owner"),
    inputUrl: profileUrl(handle),
  };
}

function profileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}
