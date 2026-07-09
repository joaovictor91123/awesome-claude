import { describe, expect, it } from "vitest";

import {
  confirmResultHtml,
  confirmResultStatus,
} from "../apps/web/src/lib/newsletter-confirm-page-lib";

const SITE = "https://heyclau.de";

describe("confirmResultStatus", () => {
  it("defaults to 200 when ok and 400 when not", () => {
    expect(confirmResultStatus(true)).toBe(200);
    expect(confirmResultStatus(false)).toBe(400);
  });

  it("prefers an explicit status", () => {
    expect(confirmResultStatus(true, 202)).toBe(202);
    expect(confirmResultStatus(false, 410)).toBe(410);
  });
});

describe("confirmResultHtml", () => {
  const base = { ok: true, heading: "Subscribed", body: "You're in." };

  it("renders the heading in the title and the body copy", () => {
    const html = confirmResultHtml(base, SITE);
    expect(html).toContain("<title>Subscribed — HeyClaude</title>");
    expect(html).toContain(
      '<h1 style="margin:12px 0 0;font-size:26px;font-weight:700;">Subscribed</h1>',
    );
    expect(html).toContain("You're in.");
  });

  it("uses the success glyph and accent when ok", () => {
    const html = confirmResultHtml(base, SITE);
    expect(html).toContain("#2f8f5b");
    expect(html).toContain("✓");
  });

  it("uses the failure glyph and accent when not ok", () => {
    const html = confirmResultHtml({ ...base, ok: false }, SITE);
    expect(html).toContain("#b4541f");
    expect(html).toContain("—");
  });

  it("renders a confirm form carrying the token when one is given", () => {
    const html = confirmResultHtml({ ...base, token: "tok123" }, SITE);
    expect(html).toContain('action="/api/public/newsletter/confirm"');
    expect(html).toContain('name="token" value="tok123"');
    expect(html).not.toContain("Browse the directory");
  });

  it("HTML-escapes the token", () => {
    const html = confirmResultHtml({ ...base, token: '"><script>' }, SITE);
    expect(html).not.toContain('value=""><script>');
    expect(html).toContain("&lt;script&gt;");
  });

  it("links back to the site's browse page when there is no token", () => {
    const html = confirmResultHtml(base, SITE);
    expect(html).toContain(`href="${SITE}/browse"`);
    expect(html).toContain("Browse the directory");
    expect(html).not.toContain("<form");
  });

  it("marks the page noindex", () => {
    expect(confirmResultHtml(base, SITE)).toContain(
      'name="robots" content="noindex"',
    );
  });
});
