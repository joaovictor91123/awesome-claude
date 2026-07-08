import { describe, expect, it } from "vitest";

import {
  getEventEmail,
  shouldNotify,
  toDiscordContent,
} from "@/lib/newsletter-webhook-lib";

describe("getEventEmail", () => {
  it("returns the string email or 'unknown'", () => {
    expect(getEventEmail({ email: "a@b.com" })).toBe("a@b.com");
    expect(getEventEmail({ email: 123 })).toBe("unknown");
    expect(getEventEmail(undefined)).toBe("unknown");
  });
});

describe("shouldNotify", () => {
  it("notifies for contact.* and delivered/bounced", () => {
    expect(shouldNotify({ type: "contact.created" })).toBe(true);
    expect(shouldNotify({ type: "email.delivered" })).toBe(true);
    expect(shouldNotify({ type: "email.bounced" })).toBe(true);
  });

  it("ignores other event types", () => {
    expect(shouldNotify({ type: "email.opened" })).toBe(false);
    expect(shouldNotify({})).toBe(false);
  });
});

describe("toDiscordContent", () => {
  it("renders contact.created", () => {
    expect(
      toDiscordContent({ type: "contact.created", data: { email: "a@b.com" } }),
    ).toContain("subscriber added: `a@b.com`");
  });

  it("distinguishes updated vs unsubscribed for contact.updated", () => {
    expect(
      toDiscordContent({ type: "contact.updated", data: { email: "a@b.com" } }),
    ).toContain("subscriber updated");
    expect(
      toDiscordContent({
        type: "contact.updated",
        data: { email: "a@b.com", unsubscribed: true },
      }),
    ).toContain("unsubscribe");
  });

  it("renders bounced and delivered", () => {
    expect(toDiscordContent({ type: "email.bounced" })).toContain("bounced");
    expect(toDiscordContent({ type: "email.delivered" })).toContain(
      "delivered",
    );
  });

  it("falls back for unknown types", () => {
    expect(toDiscordContent({ type: "email.opened" })).toContain(
      "Resend event: `email.opened`",
    );
    expect(toDiscordContent({})).toContain("`unknown`");
  });
});
