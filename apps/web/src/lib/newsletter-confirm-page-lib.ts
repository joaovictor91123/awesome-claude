// Pure rendering for the newsletter confirmation landing page, split out of the
// confirm route so the markup and status selection can be unit-tested without
// constructing a Response.

import { escapeHtml } from "@/lib/newsletter-emails-lib";
import { siteConfig } from "@/lib/site";

export interface ConfirmResultOptions {
  ok: boolean;
  heading: string;
  body: string;
  /** When present, renders a confirm form that re-posts this token. */
  token?: string;
  /** Explicit HTTP status; otherwise derived from `ok`. */
  status?: number;
}

/** The confirmation page's status: an explicit `status`, else 200 when ok and 400 when not. */
export function confirmResultStatus(ok: boolean, status?: number): number {
  return status ?? (ok ? 200 : 400);
}

/**
 * Render the minimal, on-brand confirmation landing page. A `token` renders the
 * re-post confirm form (with the token HTML-escaped); without one the page
 * links back to `siteUrl`'s browse page. The accent glyph and colour follow
 * `ok`.
 */
export function confirmResultHtml(
  opts: Pick<ConfirmResultOptions, "ok" | "heading" | "body" | "token">,
  siteUrl = siteConfig.url,
): string {
  const accent = opts.ok ? "#2f8f5b" : "#b4541f";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${opts.heading} — HeyClaude</title>
  </head>
  <body style="margin:0;background:#f7f5ef;font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#171614;">
    <main style="max-width:480px;margin:0 auto;padding:80px 20px;text-align:center;">
      <div style="font:600 13px/1.4 sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#6b6a64;">HeyClaude</div>
      <div style="margin-top:20px;font-size:40px;color:${accent};">${opts.ok ? "✓" : "—"}</div>
      <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;">${opts.heading}</h1>
      <p style="margin:14px 0 0;color:#4d4c47;">${opts.body}</p>
      ${opts.token ? `<form method="post" action="/api/public/newsletter/confirm" style="margin:28px 0 0;"><input type="hidden" name="token" value="${escapeHtml(opts.token)}" /><button type="submit" style="border:0;background:#171614;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px;cursor:pointer;">Confirm subscription</button></form>` : `<a href="${siteUrl}/browse" style="display:inline-block;margin-top:28px;background:#171614;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px;">Browse the directory</a>`}
    </main>
  </body>
</html>`;
}
