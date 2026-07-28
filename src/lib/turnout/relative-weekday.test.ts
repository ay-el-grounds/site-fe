import assert from "node:assert/strict";
import test from "node:test";

import {
  parseTurnoutDateTime,
  resolveRelativeWeekdayDate,
} from "@/lib/instagram-monitor";

test("corrects a relative weekday while preserving the extracted time", () => {
  assert.equal(
    resolveRelativeWeekdayDate(
      "2026-07-24T10:30:00",
      "Open house this Sunday at 10:30am.",
      "2026-07-22T10:54:47.000Z"
    ),
    "2026-07-26T10:30:00"
  );
});

test("prefers an explicit dated weekday over a nearby relative phrase", () => {
  assert.equal(
    resolveRelativeWeekdayDate(
      "2026-07-26T10:00:00",
      "See you at our next Sunday Motoring Meet on Sunday, August 23rd.",
      "2026-07-20T13:08:18.000Z"
    ),
    "2026-08-23T10:00:00"
  );
});

test("interprets offset-free Turnout times in America/New_York", () => {
  assert.equal(
    parseTurnoutDateTime("2026-08-02T09:00:00").toISOString(),
    "2026-08-02T13:00:00.000Z"
  );
  assert.equal(
    parseTurnoutDateTime("2026-11-19T10:00:00").toISOString(),
    "2026-11-19T15:00:00.000Z"
  );
  assert.equal(
    parseTurnoutDateTime("2026-08-02T09:00:00-04:00").toISOString(),
    "2026-08-02T13:00:00.000Z"
  );
});

test("leaves matching and absolute event dates unchanged", () => {
  assert.equal(
    resolveRelativeWeekdayDate(
      "2026-07-26T10:30:00",
      "Open house this Sunday at 10:30am.",
      "2026-07-22T10:54:47.000Z"
    ),
    "2026-07-26T10:30:00"
  );
  assert.equal(
    resolveRelativeWeekdayDate(
      "2026-07-24T10:30:00",
      "Open house on July 24 at 10:30am.",
      "2026-07-22T10:54:47.000Z"
    ),
    "2026-07-24T10:30:00"
  );
});
