import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  APIFY_DETAILS_PARSER_VERSION,
  computeRetrievalWindow,
  normalizeApifyDetailsItem,
} from "./apify-details";

const NOW = new Date("2026-07-24T00:00:00.000Z");
const WINDOW_START = new Date("2026-07-21T00:00:00.000Z");

function loadFixture(name: string): unknown[] {
  const fixtureUrl = new URL(`./__fixtures__/${name}`, import.meta.url);
  return JSON.parse(readFileSync(fixtureUrl, "utf8"));
}

test("normalizes account identity, collaborative posts, and reel metadata", () => {
  const [raw] = loadFixture("apify-details-success.json");
  const outcome = normalizeApifyDetailsItem(raw, {
    now: NOW,
    retrievalWindowStart: WINDOW_START,
    previousSuccessfulRetrievalAt: new Date("2026-07-23T00:00:00.000Z"),
  });

  assert.equal(outcome.status, "RETRIEVED");
  assert.equal(outcome.handle, "turnout_fixture");
  assert.equal(outcome.providerAccountId, "10001");
  assert.equal(outcome.posts.length, 2);
  assert.deepEqual(outcome.fallbackReasons, []);
  assert.equal(
    outcome.providerSchemaVersion,
    APIFY_DETAILS_PARSER_VERSION
  );

  const reel = outcome.posts.find(
    (post) => post.shortcode === "FixtureReelB"
  );
  assert.ok(reel);
  assert.equal(reel.accountHandle, "turnout_fixture");
  assert.equal(reel.ownerHandle, "fixture_collaborator");
  assert.equal(reel.media.productType, "clips");
  assert.equal(reel.media.videoUrl, "https://example.com/fixture-reel-b.mp4");
});

test("distinguishes a provider failure from a valid empty profile", () => {
  const [missing, empty] = loadFixture("apify-details-partial.json");

  const missingOutcome = normalizeApifyDetailsItem(missing, {
    now: NOW,
    retrievalWindowStart: WINDOW_START,
  });
  const emptyOutcome = normalizeApifyDetailsItem(empty, {
    now: NOW,
    retrievalWindowStart: WINDOW_START,
  });

  assert.equal(missingOutcome.status, "NOT_FOUND");
  assert.equal(missingOutcome.handle, "turnout_fixture_missing");
  assert.equal(missingOutcome.errorCode, "not_found");

  assert.equal(emptyOutcome.status, "EMPTY");
  assert.equal(emptyOutcome.handle, "turnout_fixture_empty");
  assert.equal(emptyOutcome.errorCode, null);
  assert.deepEqual(emptyOutcome.posts, []);
});

test("requires a posts fallback when latestPosts is missing or malformed", () => {
  const missingLatestPosts = {
    inputUrl: "https://www.instagram.com/turnout_fixture/",
    username: "turnout_fixture",
    id: "10001",
    private: false,
  };
  const malformedLatestPosts = {
    ...missingLatestPosts,
    latestPosts: [{ id: "post-without-required-fields" }],
  };

  const missingOutcome = normalizeApifyDetailsItem(missingLatestPosts, {
    now: NOW,
    retrievalWindowStart: WINDOW_START,
  });
  const malformedOutcome = normalizeApifyDetailsItem(malformedLatestPosts, {
    now: NOW,
    retrievalWindowStart: WINDOW_START,
  });

  assert.equal(missingOutcome.status, "FALLBACK_REQUIRED");
  assert.deepEqual(missingOutcome.fallbackReasons, ["LATEST_POSTS_MISSING"]);
  assert.equal(malformedOutcome.status, "FALLBACK_REQUIRED");
  assert.deepEqual(malformedOutcome.fallbackReasons, ["LATEST_POSTS_INVALID"]);
});

test("detects a truncated 12-post feed without letting old pins mask it", () => {
  const [raw] = loadFixture("apify-details-truncated.json");
  const outcome = normalizeApifyDetailsItem(raw, {
    now: NOW,
    retrievalWindowStart: WINDOW_START,
    previousSuccessfulRetrievalAt: new Date("2026-07-23T00:00:00.000Z"),
  });

  assert.equal(outcome.posts.length, 12);
  assert.equal(outcome.status, "FALLBACK_REQUIRED");
  assert.deepEqual(outcome.fallbackReasons, ["LATEST_POSTS_TRUNCATED"]);
});

test("accepts a 12-post feed that reaches beyond the retrieval window", () => {
  const [fixture] = loadFixture("apify-details-truncated.json");
  const raw = structuredClone(fixture) as {
    latestPosts: Array<{ timestamp: string; isPinned?: boolean }>;
  };
  raw.latestPosts[11].timestamp = "2026-07-20T12:00:00.000Z";

  const outcome = normalizeApifyDetailsItem(raw, {
    now: NOW,
    retrievalWindowStart: WINDOW_START,
    previousSuccessfulRetrievalAt: new Date("2026-07-23T00:00:00.000Z"),
  });

  assert.equal(outcome.status, "RETRIEVED");
  assert.deepEqual(outcome.fallbackReasons, []);
});

test("requires fallback when the previous successful retrieval is stale", () => {
  const [raw] = loadFixture("apify-details-success.json");
  const outcome = normalizeApifyDetailsItem(raw, {
    now: NOW,
    retrievalWindowStart: new Date("2026-07-17T00:00:00.000Z"),
    previousSuccessfulRetrievalAt: new Date("2026-07-19T00:00:00.000Z"),
  });

  assert.equal(outcome.status, "FALLBACK_REQUIRED");
  assert.deepEqual(outcome.fallbackReasons, ["RETRIEVAL_GAP"]);
});

test("uses a three-day minimum window and expands after missed runs", () => {
  const normal = computeRetrievalWindow({
    now: NOW,
    lastCompletedRetrievalAt: new Date("2026-07-23T00:00:00.000Z"),
  });
  const recovered = computeRetrievalWindow({
    now: NOW,
    lastCompletedRetrievalAt: new Date("2026-07-18T00:00:00.000Z"),
  });
  const initial = computeRetrievalWindow({ now: NOW });
  const capped = computeRetrievalWindow({
    now: NOW,
    lastCompletedRetrievalAt: new Date("2026-05-01T00:00:00.000Z"),
  });

  assert.equal(normal.lookbackDays, 3);
  assert.equal(normal.start.toISOString(), "2026-07-21T00:00:00.000Z");
  assert.equal(recovered.lookbackDays, 7);
  assert.equal(recovered.start.toISOString(), "2026-07-17T00:00:00.000Z");
  assert.equal(initial.lookbackDays, 30);
  assert.equal(initial.isHistoricalBackfill, true);
  assert.equal(capped.lookbackDays, 30);
});
