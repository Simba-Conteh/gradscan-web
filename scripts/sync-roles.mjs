// Syncs the source-of-truth roles.json from the gradscan folder to:
//   1. data/roles.json (build-time fallback bundled with the site)
//   2. the Supabase `roles` + `site_meta` tables (the live feed the deployed
//      site reads) - so the daily scan updates production with NO redeploy.
//
// The personal profile block is stripped: users build their own profiles
// in-app, and nothing personal belongs in the repo or the shared tables.
//
// Supabase credentials come from .env.sync (gitignored, this machine only):
//   SUPABASE_URL=...           SUPABASE_SERVICE_ROLE_KEY=...
// Without that file the script still syncs the JSON and just skips the DB.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "gradscan", "roles.json");
const dst = join(here, "..", "data", "roles.json");

const { meta, roles } = JSON.parse(readFileSync(src, "utf-8"));
writeFileSync(dst, JSON.stringify({ meta, roles }, null, 2) + "\n", "utf-8");
console.log(`Synced ${roles.length} roles (profile stripped) -> data/roles.json`);

const envPath = join(here, "..", ".env.sync");
if (!existsSync(envPath)) {
  console.log("No .env.sync found - skipped the live database sync.");
  process.exit(0);
}
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const { createClient } = await import("@supabase/supabase-js");
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rows = roles.map((r) => ({
  id: r.id,
  company: r.company,
  title: r.title,
  sector: r.sector,
  type: r.type,
  location: r.location ?? "",
  opens: r.opens ?? null,
  deadline: r.deadline ?? null,
  status: r.status,
  min_grade: r.min_grade ?? null,
  eligibility: r.eligibility ?? null,
  notes: r.notes ?? null,
  source: r.source,
  first_seen: r.first_seen,
  region_confirmed: !!r.region_confirmed,
  date_confidence: r.date_confidence,
  tags: r.tags ?? [],
  updated_at: new Date().toISOString(),
}));

const { error: upErr } = await db.from("roles").upsert(rows);
if (upErr) {
  console.error("roles upsert FAILED:", upErr.message);
  process.exit(1);
}

// Remove rows whose id no longer exists in the source of truth.
const ids = roles.map((r) => r.id);
const { data: existing, error: listErr } = await db.from("roles").select("id");
if (!listErr) {
  const stale = existing.map((x) => x.id).filter((id) => !ids.includes(id));
  if (stale.length) {
    const { error: delErr } = await db.from("roles").delete().in("id", stale);
    console.log(
      delErr ? `stale delete FAILED: ${delErr.message}` : `Removed ${stale.length} stale roles`,
    );
  }
}

const { error: metaErr } = await db.from("site_meta").upsert({
  id: 1,
  last_updated: meta.last_updated,
  region_scope: meta.region_scope ?? "UK-wide",
  portal_access_log: meta.portal_access_log ?? null,
  updated_at: new Date().toISOString(),
});
if (metaErr) {
  console.error("site_meta upsert FAILED:", metaErr.message);
  process.exit(1);
}
console.log(`Live database updated: ${rows.length} roles, last_updated ${meta.last_updated}`);
