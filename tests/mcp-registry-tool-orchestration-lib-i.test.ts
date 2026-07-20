import { describe, expect, it } from "vitest";

import {
  getInstallGuidance,
  listCategoryEntries,
  recommendForTask,
} from "../packages/mcp/src/registry-tool-orchestration-lib.js";

const entry = {
  category: "skills",
  slug: "demo",
  title: "Demo Skill",
  description: "browser automation demo skill",
  installCommand: "npx -y demo",
  platforms: ["claude-code"],
  tags: ["demo"],
};

const artifactOptions = {
  readJsonArtifact: async (relativePath: string) =>
    relativePath === "entries/skills/demo.json"
      ? { entry }
      : { entries: [entry] },
  readTextArtifact: async () => JSON.stringify({ entry }),
};

describe("registry-tool-orchestration unscoped listings", () => {
  it("recommends across every category when none is requested", async () => {
    const result = await recommendForTask(
      { task: "browser automation demo" },
      artifactOptions,
    );
    expect(result.ok).toBe(true);
    expect(result.category).toBe("");
  });

  it("lists entries across every category when none is requested", async () => {
    const result = await listCategoryEntries({}, artifactOptions);
    expect(result.ok).toBe(true);
    expect(result.category).toBe("");
    expect(result.total).toBe(1);
  });
});

describe("registry-tool-orchestration listing trust filters", () => {
  const withNotes = {
    category: "mcp",
    slug: "with-notes",
    title: "With Notes",
    description: "mcp server with safety notes",
    platforms: ["claude-code"],
    tags: [],
    safetyNotes: [{ text: "Runs shell commands" }],
  };
  const withoutNotes = {
    category: "mcp",
    slug: "without-notes",
    title: "Without Notes",
    description: "mcp server with no notes",
    platforms: ["claude-code"],
    tags: [],
  };
  const options = {
    readJsonArtifact: async () => ({ entries: [withNotes, withoutNotes] }),
    readTextArtifact: async () => "{}",
  };

  it("filters the listing by hasSafetyNotes before pagination", async () => {
    const result = await listCategoryEntries(
      { hasSafetyNotes: "true" },
      options,
    );
    expect(result.ok).toBe(true);
    expect(result.total).toBe(1);
    expect(result.entries.map((entry) => entry.slug)).toEqual(["with-notes"]);
  });

  it("still returns every entry when no trust filter is supplied", async () => {
    const result = await listCategoryEntries({}, options);
    expect(result.total).toBe(2);
    expect(result.entries.map((entry) => entry.slug).sort()).toEqual([
      "with-notes",
      "without-notes",
    ]);
  });
});

describe("registry-tool-orchestration install guidance platform selection", () => {
  it("leaves compatibility unselected when no platform is requested", async () => {
    const result = await getInstallGuidance(
      { category: "skills", slug: "demo" },
      artifactOptions,
    );
    expect(result.ok).toBe(true);
    expect(result.selectedCompatibility).toBeNull();
  });

  it("returns null compatibility when the platform has no matching row", async () => {
    const result = await getInstallGuidance(
      { category: "skills", slug: "demo", platform: "zed" },
      artifactOptions,
    );
    expect(result.ok).toBe(true);
    expect(result.selectedCompatibility).toBeNull();
  });
});
