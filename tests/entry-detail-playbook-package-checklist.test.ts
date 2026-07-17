import { describe, expect, it } from "vitest";
import type { Entry } from "@/types/registry";
import {
  entryDecisionTrustScore,
  entryDetailDecisionPlaybookState,
} from "@/lib/entry-detail-decision-playbook-lib";

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    category: "tools",
    slug: "fixture",
    title: "Fixture",
    description: "Fixture description",
    author: "Author",
    tags: [],
    platforms: ["claude-code"],
    installType: "manual",
    trust: "review",
    source: "unverified",
    dateAdded: "2026-01-01",
    ...overrides,
  } as Entry;
}

function itemDetail(target: Entry, sectionId: string, itemId: string) {
  const state = entryDetailDecisionPlaybookState(target, []);
  const section = state.sections.find((item) => item.id === sectionId);
  return section?.items.find((item) => item.id === itemId)?.detail;
}

function itemDone(target: Entry, sectionId: string, itemId: string) {
  const state = entryDetailDecisionPlaybookState(target, []);
  const section = state.sections.find((item) => item.id === sectionId);
  return section?.items.find((item) => item.id === itemId)?.done;
}

describe("entry-detail-decision-playbook-lib package checklist", () => {
  it("reports an available install payload", () => {
    const withInstall = entry({ installCommand: "npx -y demo" });
    expect(itemDetail(withInstall, "package", "installable")).toBe(
      "Install or copy payload is available for review.",
    );
    expect(itemDone(withInstall, "package", "installable")).toBe(true);
  });

  it("reports a missing install payload", () => {
    expect(itemDetail(entry(), "package", "installable")).toBe(
      "No install payload is present in this listing.",
    );
    expect(itemDone(entry(), "package", "installable")).toBe(false);
  });

  it("distinguishes verified, explicitly unverified, and absent package flags", () => {
    expect(
      itemDetail(
        entry({ packageVerified: true }),
        "package",
        "package-verified",
      ),
    ).toBe("Package marked verified.");
    expect(
      itemDetail(
        entry({ packageVerified: false }),
        "package",
        "package-verified",
      ),
    ).toBe("Package explicitly marked unverified.");
    expect(itemDetail(entry(), "package", "package-verified")).toBe(
      "No package verification flag provided.",
    );
  });

  it("reports checksum presence", () => {
    expect(
      itemDetail(entry({ downloadSha256: "abc123" }), "package", "sha256"),
    ).toBe("SHA-256 hash is present.");
    expect(itemDetail(entry(), "package", "sha256")).toBe(
      "No checksum provided for downloaded artifact.",
    );
  });
});

describe("entry-detail-decision-playbook-lib source checklist", () => {
  it("credits a reviewed listing", () => {
    expect(itemDetail(entry({ reviewed: true }), "source", "reviewed")).toBe(
      "Registry metadata indicates a reviewed listing.",
    );
  });
});

describe("entry-detail-decision-playbook-lib trust score", () => {
  it("credits an install payload in the trust score", () => {
    const withInstall = entryDecisionTrustScore(
      entry({ installCommand: "npx -y demo" }),
    );
    const withoutInstall = entryDecisionTrustScore(entry());
    expect(withInstall).toBeGreaterThan(withoutInstall);
  });
});
