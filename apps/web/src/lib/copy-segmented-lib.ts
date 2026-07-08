// Pure resolution of an entry's copy variants (install/config/full), split out
// of the copy-segmented component so the harness-override precedence and the
// top-level fallbacks can be unit-tested without rendering the component.

import type { CopyVariant } from "@/lib/dossier-prefs";

export interface VariantOption {
  id: CopyVariant;
  label: string;
  value?: string;
}

/**
 * Resolve the variants array for an entry, honoring an optional harness variant
 * override and falling back to the entry's top-level fields.
 */
export function variantsForEntry(
  entry: {
    installCommand?: string;
    configSnippet?: string;
    fullCopy?: string;
    harnessVariants?: Record<
      string,
      { installCommand?: string; configSnippet?: string; fullCopy?: string } | undefined
    >;
  },
  harnessId?: string | null,
): VariantOption[] {
  const hv = harnessId ? entry.harnessVariants?.[harnessId] : undefined;
  return [
    { id: "install", label: "Install", value: hv?.installCommand ?? entry.installCommand },
    { id: "config", label: "Config", value: hv?.configSnippet ?? entry.configSnippet },
    { id: "full", label: "Full", value: hv?.fullCopy ?? entry.fullCopy },
  ];
}
