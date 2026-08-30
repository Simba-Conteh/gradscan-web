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

// Snapshot statuses before the upsert so we can detect roles going live.
const { data: prevRows } = await db.from("roles").select("id,status");
const prevStatus = new Map((prevRows ?? []).map((r) => [r.id, r.status]));

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

// --- Job alerts: email users watching a role that just went live ----------
// Requires RESEND_API_KEY (+ optional ALERT_FROM) in .env.sync. Without a
// key, qualifying alerts are logged so nothing fails silently.
const wentLive = rows.filter(
  (r) => r.status === "Open" && prevStatus.has(r.id) && prevStatus.get(r.id) !== "Open",
);
if (wentLive.length > 0) {
  const { data: alerts } = await db
    .from("role_alerts")
    .select("user_id, role_id")
    .in("role_id", wentLive.map((r) => r.id));
  if (alerts?.length) {
    const userIds = [...new Set(alerts.map((a) => a.user_id))];
    const { data: optedIn } = await db
      .from("profiles")
      .select("user_id")
      .in("user_id", userIds)
      .eq("email_alerts", true);
    const optedSet = new Set((optedIn ?? []).map((p) => p.user_id));
    const { data: usersPage } = await db.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map((usersPage?.users ?? []).map((u) => [u.id, u.email]));

    for (const uid of userIds) {
      if (!optedSet.has(uid)) continue;
      const email = emailById.get(uid);
      if (!email) continue;
      const theirRoles = alerts
        .filter((a) => a.user_id === uid)
        .map((a) => wentLive.find((r) => r.id === a.role_id))
        .filter(Boolean);
      const lines = theirRoles.map((r) => `- ${r.company}: ${r.title} (${r.location}) is now OPEN`);
      const body = `Good news - a role you're watching on GradScan just went live:\n\n${lines.join("\n")}\n\nApply early: most schemes fill on a rolling basis.\nhttps://gradscan.uk\n\n(You get this because email alerts are ticked on your GradScan profile. Untick to stop.)`;

      if (env.RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.ALERT_FROM ?? "GradScan <onboarding@resend.dev>",
            to: [email],
            subject: `GradScan alert: ${theirRoles[0].company} is now open`,
            text: body,
          }),
        }).catch((e) => ({ ok: false, statusText: String(e) }));
        console.log(`alert email to ${email}: ${res.ok ? "sent" : "FAILED " + res.statusText}`);
      } else {
        console.log(`alert queued (no RESEND_API_KEY) for ${email}: ${lines.join("; ")}`);
      }
    }
  } else {
    console.log(`${wentLive.length} role(s) went live but nobody is watching them yet.`);
  }
}
