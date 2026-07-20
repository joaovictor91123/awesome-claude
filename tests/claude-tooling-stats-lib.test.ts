import { describe, expect, it } from "vitest";
import { buildClaudeToolingReport } from "@/lib/claude-tooling-stats-lib";
import { buildClaudeToolingReport as buildFromWrapper } from "@/lib/claude-tooling-stats";
import { ENTRIES } from "@/data/entries";
import { TRUST_LABEL } from "@/types/registry";

describe("claude-tooling-stats-lib", () => {
  it("builds a deterministic report model with key dimensions", () => {
    const a = buildClaudeToolingReport(ENTRIES, "2026-07-16");
    const b = buildClaudeToolingReport(ENTRIES, "2026-07-16");
    expect(a).toEqual(b);
    expect(a.slug).toBe("/state-of-claude-tooling");
    expect(a.exportSlug).toBe("claude-tooling");
    expect(a.total).toBeGreaterThan(500);
    expect(a.dimensions.map((dimension) => dimension.key)).toEqual(
      expect.arrayContaining([
        "categories",
        "trust",
        "source",
        "platforms",
        "install-methods",
      ]),
    );
  });

  it("keeps wrapper re-export aligned", () => {
    expect(buildFromWrapper(ENTRIES, "2026-07-16")).toEqual(
      buildClaudeToolingReport(ENTRIES, "2026-07-16"),
    );
  });

  it("drops every empty dimension when there are no entries", () => {
    const report = buildClaudeToolingReport([], "2026-07-16");
    expect(report.total).toBe(0);
    expect(report.stats.find((stat) => stat.key === "total")?.value).toBe(0);
    // Categories/trust/source/platform/install/notes rows are all empty -> filtered out.
    expect(report.dimensions).toEqual([]);
  });

  it("keeps only the category row present in a single-category subset", () => {
    const anchorCategory = ENTRIES[0].category;
    const subset = ENTRIES.filter((entry) => entry.category === anchorCategory);
    const report = buildClaudeToolingReport(subset, "2026-07-16");
    const categories = report.dimensions.find(
      (dimension) => dimension.key === "categories",
    );
    expect(categories?.rows).toHaveLength(1);
    expect(categories?.rows[0].count).toBe(subset.length);
  });

  it("keeps only the trust rows that actually occur in the input", () => {
    const anchorTrust = ENTRIES[0].trust;
    const subset = ENTRIES.filter((entry) => entry.trust === anchorTrust);
    const report = buildClaudeToolingReport(subset, "2026-07-16");
    const trust = report.dimensions.find(
      (dimension) => dimension.key === "trust",
    );
    expect(trust?.rows).toHaveLength(1);
    expect(trust?.rows[0]).toMatchObject({
      label: TRUST_LABEL[anchorTrust],
      count: subset.length,
    });
  });

  it("keeps platform and notes-coverage rows internally consistent", () => {
    const report = buildClaudeToolingReport(ENTRIES, "2026-07-16");
    const platforms = report.dimensions.find(
      (dimension) => dimension.key === "platforms",
    );
    expect(platforms?.rows.length).toBeGreaterThan(0);
    expect(platforms?.rows.every((row) => row.count > 0)).toBe(true);

    const notes = report.dimensions.find(
      (dimension) => dimension.key === "notes-coverage",
    );
    const noteCount = (label: string) =>
      notes?.rows.find((row) => row.label === label)?.count ?? 0;
    // "Both" can never exceed either individual coverage count.
    expect(noteCount("Both")).toBeLessThanOrEqual(
      Math.min(noteCount("Safety notes"), noteCount("Privacy notes")),
    );
  });
});
