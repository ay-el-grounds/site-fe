import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  APIFY_POSTS_PARSER_VERSION,
  normalizeApifyPostsDataset,
} from "./apify-posts";

const fixture = JSON.parse(
  readFileSync(
    new URL("./__fixtures__/apify-posts-mixed.json", import.meta.url),
    "utf8"
  )
);
const requested = [
  {
    handle: "turnout_fixture",
    inputUrl: "https://www.instagram.com/turnout_fixture/",
  },
  {
    handle: "turnout_fixture_empty",
    inputUrl: "https://www.instagram.com/turnout_fixture_empty/",
  },
];

test("normalizes posts and preserves requested ownership for collaborations", () => {
  const outcomes = normalizeApifyPostsDataset(fixture, requested);
  const outcome = outcomes.get("turnout_fixture")!;

  assert.equal(outcome.status, "RETRIEVED");
  assert.equal(outcome.posts.length, 2);
  assert.equal(outcome.posts[1].accountHandle, "turnout_fixture");
  assert.equal(outcome.posts[1].ownerHandle, "fixture_collaborator");
  assert.equal(
    outcome.posts[1].providerSchemaVersion,
    APIFY_POSTS_PARSER_VERSION
  );
});

test("treats no_items as empty while leaving a missing account unexplained", () => {
  const outcomes = normalizeApifyPostsDataset(fixture, [
    ...requested,
    {
      handle: "turnout_fixture_absent",
      inputUrl: "https://www.instagram.com/turnout_fixture_absent/",
    },
  ]);

  assert.equal(outcomes.get("turnout_fixture_empty")?.status, "EMPTY");
  assert.equal(outcomes.has("turnout_fixture_absent"), false);
});

test("rejects malformed and unrequested dataset items", () => {
  assert.throws(
    () =>
      normalizeApifyPostsDataset(
        [{ inputUrl: requested[0].inputUrl, id: "missing-fields" }],
        requested
      ),
    /Invalid Apify posts result/
  );
  assert.throws(
    () =>
      normalizeApifyPostsDataset(
        [
          {
            ...fixture[0],
            inputUrl: "https://www.instagram.com/not_requested/",
          },
        ],
        requested
      ),
    /unrequested input URL/
  );
});
