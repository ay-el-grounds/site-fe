import assert from "node:assert/strict";
import test from "node:test";

import { resolveRelativeWeekdayDate } from "@/lib/instagram-monitor";

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
