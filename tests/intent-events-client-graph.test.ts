import fs from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * `intent-event-client.ts` runs in the browser and imports
 * `intent-events-lib.ts` for `normalizeIntentEntryKey`. That lib must therefore
 * never pull `@/lib/db` in at runtime, because `@/lib/db` imports
 * `cloudflare-env.server`. It only needs the `D1DatabaseLike` *type*, since
 * `queryIntentEventCounts` receives its database as an argument.
 */
describe("intent-event client module graph", () => {
  const repoRoot = new URL("..", import.meta.url);
  const read = (relativePath: string) =>
    fs.readFileSync(new URL(relativePath, repoRoot), "utf8");

  const lib = read("apps/web/src/lib/intent-events-lib.ts");

  it("imports D1DatabaseLike from @/lib/db as a type-only import", () => {
    expect(lib).toContain('import type { D1DatabaseLike } from "@/lib/db"');
  });

  it("never imports a runtime binding from @/lib/db", () => {
    // A value import (e.g. `import { getSiteDb }`) would drag
    // cloudflare-env.server into the browser bundle.
    expect(lib).not.toMatch(/^import\s*\{[^}]*\}\s*from\s*"@\/lib\/db"/m);
    expect(lib).not.toContain("getSiteDb");
  });

  it("still lets the client reach the entry-key normalizer", () => {
    const client = read("apps/web/src/lib/intent-event-client.ts");
    expect(client).toContain(
      'import { normalizeIntentEntryKey } from "@/lib/intent-events-lib"',
    );
  });

  it("keeps the server-side surface free to use getSiteDb", () => {
    // safeIntentEventCounts lives in the surface module, which is server-only.
    expect(read("apps/web/src/lib/intent-events.ts")).toContain(
      'import { getSiteDb } from "@/lib/db"',
    );
  });
});
