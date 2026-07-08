// Pure helpers for the newsletter (Resend) webhook route: decide whether an
// event is notify-worthy and render its Discord message. Split out of the route
// so the event-type routing can be unit-tested without the handler.

export type ResendEvent = {
  type?: string;
  data?: Record<string, unknown>;
};

/** Best-effort subscriber email from a Resend event payload. */
export function getEventEmail(data?: Record<string, unknown>): string {
  const value = data?.email;
  return typeof value === "string" ? value : "unknown";
}

/** True for contact.* events and delivered/bounced email events. */
export function shouldNotify(event: ResendEvent): boolean {
  const type = String(event.type ?? "");
  return type.startsWith("contact.") || type === "email.delivered" || type === "email.bounced";
}

/** Human-readable Discord message for a Resend event. */
export function toDiscordContent(event: ResendEvent): string {
  const type = String(event.type ?? "unknown");
  const email = getEventEmail(event.data);

  if (type === "contact.created") {
    return `Newsletter subscriber added: \`${email}\``;
  }
  if (type === "contact.updated") {
    const unsubscribed = Boolean(event.data?.unsubscribed);
    return unsubscribed
      ? `Newsletter unsubscribe: \`${email}\``
      : `Newsletter subscriber updated: \`${email}\``;
  }
  if (type === "email.bounced") {
    return `Newsletter delivery bounced: \`${email}\``;
  }
  if (type === "email.delivered") {
    return `Newsletter delivered: \`${email}\``;
  }

  return `Resend event: \`${type}\` (\`${email}\`)`;
}
