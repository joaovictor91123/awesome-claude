import { describe, expect, it } from "vitest";

import {
  type TrustSeverityCounts,
  trustSummaryLine,
} from "../apps/web/src/lib/trust-summary-line-lib";

const counts = (
  over: Partial<TrustSeverityCounts> = {},
): TrustSeverityCounts => ({
  ok: 0,
  info: 0,
  warning: 0,
  blocker: 0,
  ...over,
});

describe("trustSummaryLine", () => {
  it("returns an empty string when there are no blocker/warning/info tallies", () => {
    expect(trustSummaryLine(counts({ ok: 5 }))).toBe("");
  });

  it("orders blocker, then warning, then info", () => {
    expect(trustSummaryLine(counts({ blocker: 2, warning: 3, info: 4 }))).toBe(
      "2 blockers, 3 warnings, 4 info",
    );
  });

  it("pluralizes blocker and warning but not info", () => {
    expect(trustSummaryLine(counts({ blocker: 1, warning: 1, info: 1 }))).toBe(
      "1 blocker, 1 warning, 1 info",
    );
  });

  it("omits zero tallies", () => {
    expect(trustSummaryLine(counts({ warning: 2 }))).toBe("2 warnings");
  });

  it("ignores the ok tally entirely", () => {
    expect(trustSummaryLine(counts({ ok: 9, info: 1 }))).toBe("1 info");
  });
});
