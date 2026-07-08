import { describe, expect, it } from "vitest";

import { timingSafeStringEqual, toHex } from "@/lib/webhook-signature-lib";

describe("toHex", () => {
  it("lowercase-hex encodes a byte buffer with zero padding", () => {
    const bytes = new Uint8Array([0, 15, 16, 255]);
    expect(toHex(bytes.buffer)).toBe("000f10ff");
  });

  it("returns an empty string for an empty buffer", () => {
    expect(toHex(new Uint8Array([]).buffer)).toBe("");
  });
});

describe("timingSafeStringEqual", () => {
  it("is true for equal strings", () => {
    expect(timingSafeStringEqual("sha256=abc", "sha256=abc")).toBe(true);
    expect(timingSafeStringEqual("", "")).toBe(true);
  });

  it("is false for differing lengths", () => {
    expect(timingSafeStringEqual("abc", "abcd")).toBe(false);
  });

  it("is false for same-length but differing content", () => {
    expect(timingSafeStringEqual("abc", "abd")).toBe(false);
  });
});
