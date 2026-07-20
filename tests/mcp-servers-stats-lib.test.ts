import { describe, expect, it } from "vitest";
import { buildMcpServersReport } from "@/lib/mcp-servers-stats-lib";
import { buildMcpServersReport as buildFromWrapper } from "@/lib/mcp-servers-stats";
import { ENTRIES } from "@/data/entries";
import { TRUST_LABEL } from "@/types/registry";

const MCP = ENTRIES.filter((entry) => entry.category === "mcp");

describe("mcp-servers-stats-lib", () => {
  it("builds a deterministic MCP servers report model", () => {
    const a = buildMcpServersReport(ENTRIES, "2026-07-16");
    const b = buildMcpServersReport(ENTRIES, "2026-07-16");
    expect(a).toEqual(b);
    expect(a.slug).toBe("/state-of-mcp-servers");
    expect(a.exportSlug).toBe("mcp-servers");
    expect(a.total).toBeGreaterThan(100);
    expect(a.dimensions.map((dimension) => dimension.key)).toEqual(
      expect.arrayContaining([
        "transport",
        "hosting",
        "trust",
        "source",
        "install-methods",
      ]),
    );
  });

  it("keeps wrapper re-export aligned", () => {
    expect(buildFromWrapper(ENTRIES, "2026-07-16")).toEqual(
      buildMcpServersReport(ENTRIES, "2026-07-16"),
    );
  });

  it("drops every empty dimension when there are no MCP entries", () => {
    const report = buildMcpServersReport([], "2026-07-16");
    expect(report.total).toBe(0);
    expect(report.stats.every((stat) => stat.value === 0)).toBe(true);
    expect(
      report.stats.every(
        (stat) => stat.hint === "0%" || stat.hint === "registry",
      ),
    ).toBe(true);
    // Trust/source/transport/hosting/install rows are all empty -> filtered out.
    expect(report.dimensions).toEqual([]);
  });

  it("ignores non-MCP entries entirely", () => {
    const nonMcp = ENTRIES.filter((entry) => entry.category !== "mcp").slice(
      0,
      8,
    );
    expect(nonMcp.length).toBeGreaterThan(0);
    const report = buildMcpServersReport(nonMcp, "2026-07-16");
    expect(report.total).toBe(0);
    expect(report.dimensions).toEqual([]);
  });

  it("keeps only the trust rows that actually occur in the input", () => {
    const anchorTrust = MCP[0].trust;
    const subset = MCP.filter((entry) => entry.trust === anchorTrust);
    const report = buildMcpServersReport(subset, "2026-07-16");
    const trust = report.dimensions.find(
      (dimension) => dimension.key === "trust",
    );
    expect(trust?.rows).toHaveLength(1);
    expect(trust?.rows[0]).toMatchObject({
      label: TRUST_LABEL[anchorTrust],
      count: subset.length,
    });
  });

  it("counts hosting and source-backed stats consistently with the entries", () => {
    const report = buildMcpServersReport(MCP, "2026-07-16");
    const stat = (key: string) =>
      report.stats.find((entry) => entry.key === key)?.value ?? -1;
    expect(stat("total")).toBe(MCP.length);
    expect(stat("remote") + stat("local")).toBeLessThanOrEqual(MCP.length);
    expect(stat("source-backed")).toBe(
      MCP.filter(
        (entry) =>
          entry.source === "source-backed" || entry.source === "first-party",
      ).length,
    );
    // Every surviving dimension carries at least one row.
    expect(
      report.dimensions.every((dimension) => dimension.rows.length > 0),
    ).toBe(true);
  });
});
