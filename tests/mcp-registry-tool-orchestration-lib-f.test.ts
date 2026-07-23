import { describe, expect, it } from "vitest";

import {
  getPlatformAdapter,
  listRegistryResources,
  readRegistryResource,
} from "../packages/mcp/src/registry-tool-orchestration-lib.js";

const failingArtifactOptions = {
  readJsonArtifact: async () => {
    throw new Error("ENOENT: registry artifact missing");
  },
  readTextArtifact: async () => "",
};

const artifactOptions = {
  readJsonArtifact: async (relativePath: string) =>
    relativePath === "directory-index.json"
      ? { feeds: [] }
      : { entries: [{ category: "mcp", slug: "browser-bridge", title: "BB" }] },
  readTextArtifact: async () => "adapter body",
};

function resourcePayload(result: { contents: Array<{ text: string }> }) {
  return JSON.parse(result.contents[0].text);
}

describe("registry-tool-orchestration readRegistryResource uri routing", () => {
  it("reports not found for a missing or unparseable uri", async () => {
    expect(
      resourcePayload(await readRegistryResource({}, artifactOptions)).error
        .code,
    ).toBe("not_found");
  });

  it("rejects non-heyclaude protocols", async () => {
    expect(
      resourcePayload(
        await readRegistryResource(
          { uri: "https://example.com" },
          artifactOptions,
        ),
      ).error.code,
    ).toBe("not_found");
  });

  it("rejects category paths that are not slug-safe", async () => {
    expect(
      resourcePayload(
        await readRegistryResource(
          { uri: "heyclaude://category/a.b" },
          artifactOptions,
        ),
      ).error.code,
    ).toBe("invalid_request");
  });

  it("reads the directory feed index", async () => {
    const payload = resourcePayload(
      await readRegistryResource(
        { uri: "heyclaude://feeds/directory" },
        artifactOptions,
      ),
    );
    expect(payload.feeds).toEqual([]);
  });

  it("reads a category resource payload", async () => {
    const payload = resourcePayload(
      await readRegistryResource(
        { uri: "heyclaude://category/mcp" },
        artifactOptions,
      ),
    );
    expect(payload.ok).toBe(true);
    expect(payload.category).toBe("mcp");
  });

  const manyCategoryOptions = {
    readJsonArtifact: async () => ({
      entries: Array.from({ length: 30 }, (_, index) => ({
        category: "mcp",
        slug: `mcp-${index}`,
        title: `MCP ${index}`,
      })),
    }),
    readTextArtifact: async () => "",
  };

  it("bounds the category resource with offset/limit query params", async () => {
    const payload = resourcePayload(
      await readRegistryResource(
        { uri: "heyclaude://category/mcp?limit=5&offset=10" },
        manyCategoryOptions,
      ),
    );
    expect(payload).toMatchObject({
      total: 30,
      limit: 5,
      offset: 10,
      count: 5,
    });
    expect(payload.entries).toHaveLength(5);
  });

  it("caps the unbounded category resource at the default limit", async () => {
    const payload = resourcePayload(
      await readRegistryResource(
        { uri: "heyclaude://category/mcp" },
        manyCategoryOptions,
      ),
    );
    expect(payload.total).toBe(30);
    expect(payload.entries.length).toBeLessThanOrEqual(25);
    expect(payload.count).toBe(payload.entries.length);
  });

  it("returns an unavailable envelope when a resource artifact read fails", async () => {
    // A missing/corrupt artifact must not escape as a raw transport error.
    const payload = resourcePayload(
      await readRegistryResource(
        { uri: "heyclaude://category/mcp" },
        failingArtifactOptions,
      ),
    );
    expect(payload.ok).toBe(false);
    expect(payload.error?.code).toBe("unavailable");
  });
});

describe("registry-tool-orchestration listRegistryResources", () => {
  it("returns an unavailable envelope when the manifest read fails", async () => {
    const result = await listRegistryResources({}, failingArtifactOptions);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("unavailable");
  });
});

describe("registry-tool-orchestration getPlatformAdapter", () => {
  it("requires a slug", async () => {
    expect((await getPlatformAdapter({}, artifactOptions)).error.code).toBe(
      "invalid_request",
    );
  });

  it("reports adapters as unavailable for non-cursor platforms", async () => {
    const result = await getPlatformAdapter(
      { slug: "browser-bridge", platform: "vscode" },
      artifactOptions,
    );
    expect(result.ok).toBe(true);
    expect(result.platform).toBe("vscode");
  });

  it("defaults to cursor and reports missing skills as not found", async () => {
    expect(
      (await getPlatformAdapter({ slug: "nope" }, artifactOptions)).error.code,
    ).toBe("not_found");
  });
});
