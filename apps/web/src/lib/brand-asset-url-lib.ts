// Pure allowlist guard for the brand-asset proxy: only https URLs on trusted
// brandfetch CDN hosts may be fetched. Split out of the route so the guard can
// be unit-tested without the handler.

export const TRUSTED_BRAND_ASSET_HOSTS = new Set(["asset.brandfetch.io", "cdn.brandfetch.io"]);

/**
 * Normalize a brand-asset URL to a trusted https URL, or "" when it is not
 * https, not on an allow-listed brandfetch CDN host, or not a valid URL.
 */
export function normalizeTrustedBrandAssetUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return "";
    if (!TRUSTED_BRAND_ASSET_HOSTS.has(parsed.hostname.toLowerCase())) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}
