import { describe, expect, it } from "vitest";

import { normalizeTrustedBrandAssetUrl } from "@/lib/brand-asset-url-lib";

describe("normalizeTrustedBrandAssetUrl", () => {
  it("accepts https URLs on trusted brandfetch hosts", () => {
    expect(
      normalizeTrustedBrandAssetUrl("https://cdn.brandfetch.io/logo.png"),
    ).toBe("https://cdn.brandfetch.io/logo.png");
    expect(
      normalizeTrustedBrandAssetUrl("https://ASSET.brandfetch.io/x.webp"),
    ).toBe("https://asset.brandfetch.io/x.webp");
  });

  it("rejects non-https protocols", () => {
    expect(
      normalizeTrustedBrandAssetUrl("http://cdn.brandfetch.io/logo.png"),
    ).toBe("");
  });

  it("rejects untrusted hosts", () => {
    expect(normalizeTrustedBrandAssetUrl("https://evil.example/logo.png")).toBe(
      "",
    );
  });

  it("rejects unparseable values", () => {
    expect(normalizeTrustedBrandAssetUrl("not a url")).toBe("");
    expect(normalizeTrustedBrandAssetUrl("")).toBe("");
  });
});
