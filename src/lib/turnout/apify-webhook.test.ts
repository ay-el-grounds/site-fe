import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateApifyWebhook,
  parseApifyWebhookPayload,
} from "./apify-webhook";

test("authenticates bearer secrets and rejects missing configuration", () => {
  assert.equal(authenticateApifyWebhook("Bearer secret", "secret"), true);
  assert.equal(authenticateApifyWebhook("Bearer wrong", "secret"), false);
  assert.equal(authenticateApifyWebhook(null, "secret"), false);
  assert.equal(authenticateApifyWebhook("Bearer secret", undefined), false);
});

test("extracts the actor run ID without accepting dataset identifiers", () => {
  const parsed = parseApifyWebhookPayload({
    eventType: "ACTOR.RUN.SUCCEEDED",
    eventData: { actorRunId: "provider-run-1" },
    resource: {
      id: "provider-run-fallback",
      defaultDatasetId: "untrusted-dataset",
    },
  });

  assert.equal(parsed.actorRunId, "provider-run-1");
  assert.equal(parsed.eventType, "ACTOR.RUN.SUCCEEDED");
  assert.equal("datasetId" in parsed, false);
});
