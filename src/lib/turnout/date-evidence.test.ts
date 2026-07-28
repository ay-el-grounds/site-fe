import assert from "node:assert/strict";
import test from "node:test";

import { hasSpecificEventDateEvidence } from "@/lib/instagram-monitor";

test("accepts explicit calendar dates and unambiguous relative dates", () => {
  assert.equal(
    hasSpecificEventDateEvidence("Join us Saturday, August 1 from 9 AM-1 PM."),
    true
  );
  assert.equal(
    hasSpecificEventDateEvidence("The show returns on 7/31 at 10 AM."),
    true
  );
  assert.equal(
    hasSpecificEventDateEvidence("Open house this Sunday at 10:30 AM."),
    true
  );
  assert.equal(
    hasSpecificEventDateEvidence("Cars and coffee is happening tomorrow."),
    true
  );
});

test("rejects month-only promotions, sponsorships, and undated recaps", () => {
  assert.equal(
    hasSpecificEventDateEvidence(
      "Explore the events taking place during Motor Week this October."
    ),
    false
  );
  assert.equal(
    hasSpecificEventDateEvidence(
      "We welcome our presenting partner for the upcoming concours."
    ),
    false
  );
  assert.equal(
    hasSpecificEventDateEvidence("When you make it to Porsche Stimmung night."),
    false
  );
  assert.equal(
    hasSpecificEventDateEvidence("5am run to Lime Rock Park for Sunday Motoring Meet."),
    false
  );
});
