import assert from "node:assert/strict";
import test from "node:test";

import { titlesLikelyMatch } from "./classify-pending";

test("matches common title variants from the same event", () => {
  assert.equal(
    titlesLikelyMatch("Rétromobile NYC", "Rétromobile New York"),
    true
  );
  assert.equal(
    titlesLikelyMatch(
      "Looks Fast Standing Still",
      "3rd Annual Celebration of Porsche 'Looks Fast Standing Still'"
    ),
    true
  );
});

test("does not merge unrelated event titles", () => {
  assert.equal(
    titlesLikelyMatch("MiataCon 2026", "FCSCC 70th Anniversary Autocross"),
    false
  );
});
