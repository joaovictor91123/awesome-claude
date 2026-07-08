// Pure human-readable trust summary line, split out of trust-drilldown.tsx so
// the pluralization and non-zero filtering can be unit-tested without React.

/** Severity tallies as produced by `summarizeTrust`. */
export type TrustSeverityCounts = {
  ok: number;
  info: number;
  warning: number;
  blocker: number;
};

/**
 * One-line trust summary: a comma-joined list of the non-zero blocker/warning/
 * info tallies, in that order and pluralized, e.g. "2 blockers, 1 warning,
 * 3 info". Returns an empty string when all three are 0. The `ok` tally is
 * intentionally omitted from the line.
 */
export function trustSummaryLine(counts: TrustSeverityCounts): string {
  return [
    counts.blocker && `${counts.blocker} blocker${counts.blocker === 1 ? "" : "s"}`,
    counts.warning && `${counts.warning} warning${counts.warning === 1 ? "" : "s"}`,
    counts.info && `${counts.info} info`,
  ]
    .filter(Boolean)
    .join(", ");
}
