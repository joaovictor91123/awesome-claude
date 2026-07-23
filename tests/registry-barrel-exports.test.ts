import { describe, expect, it } from "vitest";

import * as registry from "@heyclaude/registry";

const surface = registry as Record<string, unknown>;

describe("@heyclaude/registry barrel exports", () => {
  // Each of these names is defined in two or more of index.js's `export *`
  // modules, so ECMAScript silently drops it from the aggregate namespace
  // unless an explicit re-export rescues it (like generatedAtForEntries).
  it.each([
    "clean",
    "entryUrl",
    "sourceUrls",
    "listValue",
    "generatedAtForEntries",
  ])("exposes %s as a function, not undefined", (name) => {
    expect(typeof surface[name]).toBe("function");
  });

  it("resolves the intended canonical implementation for each rescued name", () => {
    // clean: identical trim helper across brand-assets/quality/llms.
    expect(registry.clean("  x  ")).toBe("x");
    // entryUrl: relationships' relative form (not weekly-brief's absolute one).
    expect(registry.entryUrl({ category: "mcp", slug: "s" })).toBe(
      "/entry/mcp/s",
    );
    // sourceUrls: relationships' array gatherer.
    expect(
      Array.isArray(registry.sourceUrls({ repoUrl: "https://github.com/a/b" })),
    ).toBe(true);
    // listValue: commercial's general list parser returns an array (llms' join
    // helper would return a string), confirming the canonical pick.
    expect(Array.isArray(registry.listValue(["a", "", "b"]))).toBe(true);
  });
});
