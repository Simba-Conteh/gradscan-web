# GradScan Web

Next.js 15 + TypeScript + Tailwind v4. Live UK graduate role scanner with per-user profiles behind a login gate.

## Run it

```bash
npm install
npm run dev
```

## Structure

```
app/
  page.tsx            Landing + auth gate ("New here? Sign up" / "Jump back in")
  onboarding/         First-time profile builder (redirected here after registering)
  dashboard/          Matched roles: fit scores, urgent banner, summary cards, filters
  profile/            Edit profile any time
components/
  AuthCard.tsx        Register/login card
  AppShell.tsx        Session guard + nav for signed-in pages
  ProfileForm.tsx     The intake: name, grade, course, university, age, demographic,
                      sectors, traits, LinkedIn, portfolio, projects, CV scanner
  RolesTable.tsx      Sortable/filterable table with expandable detail rows
lib/
  backend/            Swappable auth+data layer
    index.ts          Picks the adapter (env-driven)
    local.ts          ACTIVE: browser-only demo backend (localStorage, hashed passwords)
    supabase.ts       STUB: wire this when a Supabase project is linked
  fit.ts              Fit scoring (mirrors ../gradscan dashboard) + CV keyword extraction
  roles.ts            Roles feed (JSON snapshot for now; swap for DB query later)
data/roles.json       Synced from ../gradscan/roles.json (npm run sync-roles)
supabase/schema.sql   Ready-to-run schema: profiles + roles tables with RLS
```

## Wiring the real backend later

1. Pick/create a Supabase project, run `supabase/schema.sql` on it.
2. `npm install @supabase/supabase-js`
3. `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
   ```
4. Fill in `lib/backend/supabase.ts` (implementations are sketched in comments).
   The adapter switch in `lib/backend/index.ts` is automatic once the env vars exist.
5. Optional: point `lib/roles.ts` at the `roles` table so the daily scan updates the
   live site without redeploys.

## Data pipeline

`../gradscan/roles.json` is the source of truth, refreshed by the daily scheduled
scan (discovery + re-verification, UK-only sourcing rules, date-confidence tags).
`npm run sync-roles` copies it into `data/` for the site.

## Deploy

Vercel: import the repo (or `vercel deploy`), no env vars needed in demo mode.
Demo-mode caveat: accounts live in each visitor's browser only. Real cross-device
registrations require the Supabase wiring above.
