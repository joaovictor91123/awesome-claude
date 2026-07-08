import { describe, expect, it } from "vitest";

import { variantsForEntry } from "@/lib/copy-segmented-lib";

describe("variantsForEntry", () => {
  it("uses the entry's top-level fields when no harness is given", () => {
    const variants = variantsForEntry({
      installCommand: "npm i x",
      configSnippet: "cfg",
      fullCopy: "full",
    });
    expect(variants.map((v) => v.id)).toEqual(["install", "config", "full"]);
    expect(variants.map((v) => v.value)).toEqual(["npm i x", "cfg", "full"]);
  });

  it("prefers a matching harness variant override", () => {
    const variants = variantsForEntry(
      {
        installCommand: "base-install",
        configSnippet: "base-config",
        fullCopy: "base-full",
        harnessVariants: {
          cursor: { installCommand: "cursor-install", fullCopy: "cursor-full" },
        },
      },
      "cursor",
    );
    // overridden fields come from the harness; unspecified ones fall back
    expect(variants[0].value).toBe("cursor-install");
    expect(variants[1].value).toBe("base-config");
    expect(variants[2].value).toBe("cursor-full");
  });

  it("falls back to top-level fields when the harness has no override", () => {
    const variants = variantsForEntry(
      { installCommand: "base-install", harnessVariants: {} },
      "unknown-harness",
    );
    expect(variants[0].value).toBe("base-install");
    expect(variants[1].value).toBeUndefined();
  });

  it("leaves values undefined when nothing is provided", () => {
    const variants = variantsForEntry({});
    expect(variants.every((v) => v.value === undefined)).toBe(true);
  });
});
