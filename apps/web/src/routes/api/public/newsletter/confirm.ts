import { createApiFileRoute } from "@/lib/api/file-route";
import { enforceApiRateLimit, getApiRequestId } from "@/lib/api/router";
import { getApiRouteDefinition } from "@/lib/api/contracts";
import { BodyTooLargeError, readRequestTextWithinLimit } from "@/lib/api-security";

import { getEnvString } from "@/lib/cloudflare-env.server";
import { verifyConfirmToken } from "@/lib/newsletter-token.server";
import { addNewsletterContact } from "@/routes/api/newsletter/subscribe";
import { buildWelcomeEmail } from "@/lib/newsletter-emails";
import {
  type ConfirmResultOptions,
  confirmResultHtml,
  confirmResultStatus,
} from "@/lib/newsletter-confirm-page-lib";
import { sendResendEmail } from "@/lib/newsletter-send.server";
import { siteConfig } from "@/lib/site";

// Minimal, on-brand confirmation landing page (light theme, matches the site).
function resultPage(opts: ConfirmResultOptions): Response {
  return new Response(confirmResultHtml(opts), {
    status: confirmResultStatus(opts.ok, opts.status),
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

const consumedConfirmTokens = new Map<string, number>();
const MAX_CONSUMED_CONFIRM_TOKENS = 10_000;
const CONFIRM_BODY_LIMIT_BYTES = 8 * 1024;

function pruneConsumedConfirmTokens(now: number) {
  for (const [token, expiresAt] of consumedConfirmTokens) {
    if (expiresAt <= now) consumedConfirmTokens.delete(token);
  }
  while (consumedConfirmTokens.size > MAX_CONSUMED_CONFIRM_TOKENS) {
    const oldest = consumedConfirmTokens.keys().next().value;
    if (!oldest) break;
    consumedConfirmTokens.delete(oldest);
  }
}

async function readConfirmToken(request: Request) {
  const rawBody = await readRequestTextWithinLimit(request, CONFIRM_BODY_LIMIT_BYTES);
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = JSON.parse(rawBody) as { token?: unknown } | null;
    return typeof body?.token === "string" ? body.token : "";
  }
  const token = new URLSearchParams(rawBody).get("token");
  return token ?? "";
}

export const Route = createApiFileRoute("/api/public/newsletter/confirm")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token") ?? "";
        return resultPage({
          ok: true,
          heading: "Confirm your subscription",
          body: "One more step: press the button below to confirm you want the weekly brief.",
          token,
        });
      },
      POST: async ({ request }) => {
        const requestId = getApiRequestId(request);
        const route = getApiRouteDefinition("newsletter.confirm");
        if (await enforceApiRateLimit(route, request)) {
          return resultPage({
            ok: false,
            heading: "Too many attempts",
            body: `Please wait a minute before trying again. Request ID: ${requestId}`,
          });
        }

        let token = "";
        try {
          token = await readConfirmToken(request);
        } catch (error) {
          if (error instanceof BodyTooLargeError) {
            return resultPage({
              ok: false,
              status: 413,
              heading: "Request too large",
              body: "Please use the confirmation button from your email.",
            });
          }
          if (error instanceof SyntaxError) {
            return resultPage({
              ok: false,
              heading: "Invalid request",
              body: "Please use the confirmation button from your email.",
            });
          }
          throw error;
        }

        const confirmSecret = getEnvString("NEWSLETTER_CONFIRM_SECRET");
        const resendApiKey = getEnvString("RESEND_API_KEY");
        const resendSegmentId = getEnvString("RESEND_SEGMENT_ID");

        if (!confirmSecret || !resendApiKey || !resendSegmentId) {
          return resultPage({
            ok: false,
            heading: "Not available",
            body: "Newsletter confirmation isn't configured right now.",
          });
        }

        const now = Date.now();
        pruneConsumedConfirmTokens(now);

        const payload = await verifyConfirmToken(confirmSecret, token, now);
        if (!payload) {
          return resultPage({
            ok: false,
            heading: "Link expired",
            body: "This confirmation link is invalid or has expired. Please subscribe again.",
          });
        }

        if (consumedConfirmTokens.has(token)) {
          return resultPage({
            ok: true,
            heading: "Already confirmed",
            body: "This confirmation link has already been used. You're all set.",
          });
        }

        const result = await addNewsletterContact({
          email: payload.email,
          segments: payload.segments,
          source: payload.source,
          resendApiKey,
          resendSegmentId,
        });
        if (result === "error") {
          return resultPage({
            ok: false,
            heading: "Something went wrong",
            body: "We couldn't confirm your subscription just now. Please try again shortly.",
          });
        }

        consumedConfirmTokens.set(token, payload.exp);

        // Send the welcome email on first-time confirm (best-effort; never block
        // or fail the confirmation on a welcome-send hiccup). Skip duplicates.
        if (result === "ok") {
          const from = getEnvString("RESEND_FROM");
          if (from) {
            const welcome = buildWelcomeEmail({ siteUrl: siteConfig.url });
            await sendResendEmail({
              apiKey: resendApiKey,
              from,
              to: payload.email,
              subject: welcome.subject,
              html: welcome.html,
              text: welcome.text,
            }).catch(() => false);
          }
        }

        return resultPage({
          ok: true,
          heading: "You're subscribed",
          body: "Thanks for confirming. The weekly brief lands on Sundays — unsubscribe any time.",
        });
      },
    },
  },
});
