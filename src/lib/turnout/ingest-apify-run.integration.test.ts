import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

import type { ExtractedEvent } from "@/lib/instagram-monitor";
import type { ApifyProvider, ApifyRun } from "./apify-client";
import { classifyPendingPosts } from "./classify-pending";
import { ingestApifyRun } from "./ingest-apify-run";

config({ path: ".env.local" });

const integrationTest =
  process.env.TURNOUT_DATABASE_INTEGRATION === "1" ? test : test.skip;
const prisma = new PrismaClient();
const NOW = new Date("2026-07-23T18:00:00.000Z");
const WINDOW_START = new Date("2026-07-20T18:00:00.000Z");
const createdAccountIds = new Set<string>();
const createdRunIds = new Set<string>();
const createdEventIds = new Set<string>();

test.after(async () => {
  if (createdEventIds.size) {
    await prisma.instagramPost.updateMany({
      where: { eventId: { in: [...createdEventIds] } },
      data: { eventId: null },
    });
    await prisma.event.deleteMany({ where: { id: { in: [...createdEventIds] } } });
  }
  if (createdRunIds.size) {
    await prisma.monitorRun.deleteMany({ where: { id: { in: [...createdRunIds] } } });
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

integrationTest("identical replay is stable and does not duplicate classification", async () => {
  const scenario = await createScenario(1);
  const item = detailsItem(scenario.handles[0], [postItem("ReplayPost")]);
  const provider = fakeProvider(scenario.externalRunId, [item]);

  const first = await ingestApifyRun({
    prisma,
    provider,
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  const beforeReplay = await prisma.monitorRun.findUniqueOrThrow({
    where: { id: scenario.runId },
  });
  const classified = await classifyPendingPosts({
    prisma,
    runId: scenario.runId,
    now: NOW,
    classifier: async () => futureEvent("Replay event"),
  });
  const eventPost = await prisma.instagramPost.findFirstOrThrow({
    where: { accountId: scenario.accountIds[0] },
  });
  assert.ok(eventPost.eventId);
  createdEventIds.add(eventPost.eventId);

  const replay = await ingestApifyRun({
    prisma,
    provider,
    callbackRunId: scenario.externalRunId,
    now: new Date(NOW.getTime() + 60_000),
  });
  const secondClassification = await classifyPendingPosts({
    prisma,
    runId: scenario.runId,
    now: new Date(NOW.getTime() + 60_000),
    classifier: async () => futureEvent("Replay event"),
  });
  const afterReplay = await prisma.monitorRun.findUniqueOrThrow({
    where: { id: scenario.runId },
  });

  assert.equal(first.disposition, "ingested");
  assert.equal(replay.disposition, "already_ingested");
  assert.equal(classified.eventsCreated, 1);
  assert.equal(secondClassification.claimed, 0);
  assert.equal(
    await prisma.instagramPost.count({
      where: { accountId: scenario.accountIds[0] },
    }),
    1
  );
  assert.equal(
    await prisma.event.count({ where: { id: eventPost.eventId } }),
    1
  );
  assert.equal(afterReplay.retrievedAt?.toISOString(), beforeReplay.retrievedAt?.toISOString());
  assert.equal(afterReplay.postsRetrieved, beforeReplay.postsRetrieved);
});

integrationTest("an interrupted transaction is recovered by replay", async () => {
  const scenario = await createScenario(1);
  const provider = fakeProvider(scenario.externalRunId, [
    detailsItem(scenario.handles[0], [postItem("InterruptedPost")]),
  ]);

  await assert.rejects(
    ingestApifyRun({
      prisma,
      provider,
      callbackRunId: scenario.externalRunId,
      now: NOW,
      hooks: {
        beforeCommit: () => {
          throw new Error("simulated interruption");
        },
      },
    }),
    /simulated interruption/
  );
  assert.equal(
    await prisma.instagramPost.count({
      where: { accountId: scenario.accountIds[0] },
    }),
    0
  );

  const replay = await ingestApifyRun({
    prisma,
    provider,
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  assert.equal(replay.disposition, "ingested");
  assert.equal(replay.postsRetrieved, 1);
});

integrationTest("a missing account result produces an explainable partial run", async () => {
  const scenario = await createScenario(2);
  const result = await ingestApifyRun({
    prisma,
    provider: fakeProvider(scenario.externalRunId, [
      detailsItem(scenario.handles[0], []),
    ]),
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  const outcomes = await prisma.monitorRunAccount.findMany({
    where: { runId: scenario.runId },
    orderBy: { providerInputUrl: "asc" },
  });

  assert.equal(result.status, "PARTIAL");
  assert.equal(outcomes.filter((item) => item.status === "FAILED").length, 1);
  assert.equal(
    outcomes.find((item) => item.status === "FAILED")?.errorCode,
    "missing_account_result"
  );
});

integrationTest("mixed valid, private, and not-found outcomes remain isolated", async () => {
  const scenario = await createScenario(3);
  const result = await ingestApifyRun({
    prisma,
    provider: fakeProvider(scenario.externalRunId, [
      detailsItem(scenario.handles[0], [postItem("MixedPost")]),
      {
        inputUrl: profileUrl(scenario.handles[1]),
        username: scenario.handles[1],
        id: "private-id",
        private: true,
      },
      {
        inputUrl: profileUrl(scenario.handles[2]),
        username: scenario.handles[2],
        error: "not_found",
        errorDescription: "Profile does not exist",
      },
    ]),
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  const outcomes = await prisma.monitorRunAccount.findMany({
    where: { runId: scenario.runId },
    select: { status: true },
  });

  assert.equal(result.status, "PARTIAL");
  assert.deepEqual(
    outcomes.map((item) => item.status).sort(),
    ["NOT_FOUND", "PRIVATE", "RETRIEVED"]
  );
  assert.equal(result.postsRetrieved, 1);
});

integrationTest("a malformed dataset fails atomically without persisting posts", async () => {
  const scenario = await createScenario(1);
  const result = await ingestApifyRun({
    prisma,
    provider: fakeProvider(scenario.externalRunId, [
      { username: scenario.handles[0], private: false, latestPosts: [] },
    ]),
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });

  assert.equal(result.status, "FAILED");
  assert.equal(
    await prisma.instagramPost.count({
      where: { accountId: scenario.accountIds[0] },
    }),
    0
  );
});

integrationTest("a truncated latestPosts result records a fallback requirement", async () => {
  const scenario = await createScenario(1);
  const recentPosts = Array.from({ length: 12 }, (_, index) =>
    postItem(`Truncated${index}`, new Date(NOW.getTime() - index * 60_000))
  );
  const result = await ingestApifyRun({
    prisma,
    provider: fakeProvider(scenario.externalRunId, [
      detailsItem(scenario.handles[0], recentPosts),
    ]),
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  const outcome = await prisma.monitorRunAccount.findFirstOrThrow({
    where: { runId: scenario.runId },
  });

  assert.equal(result.status, "PARTIAL");
  assert.equal(outcome.status, "FALLBACK_REQUIRED");
  assert.equal(outcome.needsFallback, true);
  assert.match(outcome.fallbackReason ?? "", /LATEST_POSTS_TRUNCATED/);
});

integrationTest("collaborative post ownership stays mapped to the requested account", async () => {
  const scenario = await createScenario(1);
  const collaborative = postItem("CollaborativePost");
  collaborative.ownerUsername = "another_creator";

  await ingestApifyRun({
    prisma,
    provider: fakeProvider(scenario.externalRunId, [
      detailsItem(scenario.handles[0], [collaborative]),
    ]),
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  const stored = await prisma.instagramPost.findFirstOrThrow({
    where: { shortcode: collaborative.shortCode },
  });

  assert.equal(stored.accountId, scenario.accountIds[0]);
  assert.equal((stored.media as { ownerUsername?: string } | null)?.ownerUsername, undefined);
});

integrationTest("an existing post refreshes metadata without resetting processing", async () => {
  const first = await createScenario(1);
  const original = postItem("MetadataPost");
  await ingestApifyRun({
    prisma,
    provider: fakeProvider(first.externalRunId, [
      detailsItem(first.handles[0], [original]),
    ]),
    callbackRunId: first.externalRunId,
    now: NOW,
  });
  await prisma.instagramPost.updateMany({
    where: { accountId: first.accountIds[0], shortcode: original.shortCode },
    data: { processingStatus: "NON_EVENT" },
  });

  const second = await createRunForExistingAccounts(first.accountIds, first.handles);
  const refreshed = {
    ...original,
    caption: "Updated caption with corrected details",
    displayUrl: "https://example.com/updated.jpg",
  };
  await ingestApifyRun({
    prisma,
    provider: fakeProvider(second.externalRunId, [
      detailsItem(first.handles[0], [refreshed]),
    ]),
    callbackRunId: second.externalRunId,
    now: new Date(NOW.getTime() + 60_000),
  });
  const posts = await prisma.instagramPost.findMany({
    where: { accountId: first.accountIds[0], shortcode: original.shortCode },
  });

  assert.equal(posts.length, 1);
  assert.equal(posts[0].caption, refreshed.caption);
  assert.equal(posts[0].mediaUrl, refreshed.displayUrl);
  assert.equal(posts[0].processingStatus, "NON_EVENT");
});

integrationTest("a concurrent duplicate callback is accepted as in progress", async () => {
  const scenario = await createScenario(1);
  const provider = fakeProvider(scenario.externalRunId, [
    detailsItem(scenario.handles[0], [postItem("ConcurrentPost")]),
  ]);
  let releaseFirst!: () => void;
  let signalLocked!: () => void;
  const locked = new Promise<void>((resolve) => {
    signalLocked = resolve;
  });
  const release = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const firstPromise = ingestApifyRun({
    prisma,
    provider,
    callbackRunId: scenario.externalRunId,
    now: NOW,
    hooks: {
      beforeCommit: async () => {
        signalLocked();
        await release;
      },
    },
  });
  await locked;

  const duplicate = await ingestApifyRun({
    prisma,
    provider,
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  releaseFirst();
  const first = await firstPromise;

  assert.equal(duplicate.disposition, "in_progress");
  assert.equal(first.disposition, "ingested");
  assert.equal(
    await prisma.instagramPost.count({
      where: { accountId: scenario.accountIds[0] },
    }),
    1
  );
});

integrationTest("Apify success with zero dataset items records a failed run", async () => {
  const scenario = await createScenario(1);
  const result = await ingestApifyRun({
    prisma,
    provider: fakeProvider(scenario.externalRunId, []),
    callbackRunId: scenario.externalRunId,
    now: NOW,
  });
  const run = await prisma.monitorRun.findUniqueOrThrow({
    where: { id: scenario.runId },
  });

  assert.equal(result.status, "FAILED");
  assert.match(run.errorSummary ?? "", /zero dataset items/);
});

async function createScenario(accountCount: number) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const handles = Array.from(
    { length: accountCount },
    (_, index) => `turnout_test_${suffix}_${index}`
  );
  const accounts = await Promise.all(
    handles.map((handle) =>
      prisma.watchedAccount.create({ data: { handle, isActive: false } })
    )
  );
  accounts.forEach((account) => createdAccountIds.add(account.id));
  return createRunForExistingAccounts(
    accounts.map((account) => account.id),
    handles
  );
}

async function createRunForExistingAccounts(
  accountIds: string[],
  handles: string[]
) {
  const externalRunId = `test-provider-${randomUUID()}`;
  const run = await prisma.monitorRun.create({
    data: {
      trigger: "MANUAL",
      status: "PENDING",
      externalRunId,
      retrievalWindowStart: WINDOW_START,
      retrievalWindowEnd: NOW,
      accountsRequested: accountIds.length,
      accounts: {
        create: accountIds.map((accountId, index) => ({
          accountId,
          providerInputUrl: profileUrl(handles[index]),
        })),
      },
    },
  });
  createdRunIds.add(run.id);
  return {
    runId: run.id,
    externalRunId,
    accountIds,
    handles,
  };
}

function fakeProvider(runId: string, items: unknown[]): ApifyProvider {
  const providerRun: ApifyRun = {
    id: runId,
    actId: "apify-instagram-scraper",
    status: "SUCCEEDED",
    defaultDatasetId: `test-dataset-${runId}`,
  };
  return {
    getRun: async () => providerRun,
    getDatasetItems: async () => items,
  };
}

function detailsItem(handle: string, latestPosts: ReturnType<typeof postItem>[]) {
  return {
    inputUrl: profileUrl(handle),
    username: handle,
    id: `profile-${handle}`,
    private: false,
    latestPosts,
  };
}

function postItem(shortCode: string, timestamp = NOW) {
  return {
    id: `provider-${shortCode}`,
    shortCode,
    url: `https://www.instagram.com/p/${shortCode}/`,
    caption: `Caption for ${shortCode} with enough content to classify.`,
    timestamp: timestamp.toISOString(),
    ownerUsername: "fixture_owner",
    displayUrl: `https://example.com/${shortCode}.jpg`,
    images: [],
    childPosts: [],
    type: "Image",
    productType: "feed",
    isPinned: false,
  };
}

function profileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

function futureEvent(title: string): ExtractedEvent {
  return {
    title,
    description: "Integration test event",
    date: "2026-07-30T10:00:00.000Z",
    endTime: null,
    venue: "Test Venue",
    address: "1 Test Street",
    city: "New York",
    state: "NY",
    categories: ["GENERAL"],
    ticketUrl: null,
  };
}
