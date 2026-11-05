# Rank Orbit — AI Visibility Dashboard

A client-facing AI Search / AI Overview visibility report for Rank Orbit LLC. Staff enter
monthly numbers in the Admin; clients see a read-only report through a private share link.
Every section can be exported as a 4320px-wide PNG, and staff can export the full report as a PDF.

**Stack:** React 18 · Vite · TypeScript (strict) · Tailwind CSS v3 · React Router v6 ·
TanStack Query · Zod · Supabase (Postgres, Auth, Storage) · hand-built SVG charts ·
`html-to-image` · `jspdf` · self-hosted `@fontsource` fonts.

## Routes

| Route | What it is |
|---|---|
| `/r/:token/:section?` | Client report (sections: `overview`, `signals`, `community`, `progress`, `profile`). `?m=YYYY-MM` picks a month. |
| `/demo/:client/:section?` | The same report with local demo data (`summit`, `harbor`). No Supabase needed. |
| `/admin/login` | Staff sign-in (email + password). |
| `/admin` | Client list. |
| `/admin/clients/:id` | Client editor: Business info · Monthly data · Share link. |
| `/admin/clients/:id/preview/:section?` | Staff preview of the client report, including draft months. |
| `/styleguide`, `/styleguide/charts` | Design system primitives and chart gallery. |

## Local setup

You need Node 20 or newer. These commands work the same in PowerShell, cmd and bash.

```bash
npm install
```

```bash
copy .env.example .env.local
```

(Use `cp` on macOS or Linux.) Then fill in `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
# Optional. The origin used in share links. Defaults to the current site.
VITE_PUBLIC_SITE_URL=https://reports.rankorbit.com
```

```bash
npm run dev
```

Open http://localhost:5173/demo to see the report with demo data. It works without Supabase.

Other scripts:

| Script | Does |
|---|---|
| `npm run build` | Type-checks (`tsc -b`) and builds to `dist/` |
| `npm test` | Runs the Vitest suite (`src/lib/metrics.test.ts`) |
| `npm run typecheck` | Type-checks only |
| `npm run seed:sql` | Regenerates `supabase/seed.sql` from `src/lib/demo.ts` |

## Supabase

### 1. Run the migration

Open your project's **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`, and run it.
Or, with the Supabase CLI linked to your project:

```bash
npx supabase db push
```

The migration creates:

- Tables `clients`, `months`, `share_links` and `staff`, with RLS turned on for all of them.
  Only users listed in `staff` can read or write clients, months and share links.
  Anonymous users have no table access at all.
- `get_report(p_token)`, a `security definer` RPC. It checks that the token exists and is not
  revoked, updates `last_viewed_at`, and returns the client and its **published** months.
  It returns `null` for unknown or revoked tokens. The app then shows "This link is no longer active".
- `is_staff()`, used by the policies and by the Admin login check.
- A private Storage bucket `logos` (PNG or SVG, 2 MB max) that only staff can access.

### 2. Deploy the `report` Edge Function (for logos)

The bucket is private, so client logos need a signed URL. The `report` function calls `get_report`
and adds a 1-hour signed logo URL:

```bash
npx supabase functions deploy report --no-verify-jwt
```

If the function is not deployed, the app calls the RPC directly. The report still works, and the
business profile shows the initials square instead of the logo.

### 3. Seed the demo clients (optional)

Run `supabase/seed.sql` in the SQL Editor. It adds the two demo clients from the mockup
(Summit Peak Plumbing & Drain with 5 months, and Harbor Line Dental Studio with 3 months), plus two
demo share links:

- `/r/demo-summit-peak-plumbing-2026`
- `/r/demo-harbor-line-dental-2026`

These tokens are public in this repository. **Revoke them, or don't run the seed, in production.**

### 4. Create the first staff user

1. In Supabase, go to **Authentication → Users → Add user**. Create the user with an email and
   password, and tick "Auto confirm".
2. Copy the new user's UUID and run this in the SQL Editor:

   ```sql
   insert into public.staff (user_id, role) values ('<user-uuid>', 'owner');
   ```

3. Sign in at `/admin/login`.

A signed-in user who is not in `staff` sees a "No staff access" page and cannot read any data.
Turn off public sign-ups (**Authentication → Providers → Email → Enable sign ups**). Staff
accounts should only be created by an owner.

## Deploy to Vercel

1. Import the repository in Vercel. The framework preset is **Vite**: the build command is
   `npm run build` and the output directory is `dist`.
2. Add the environment variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and, optionally,
   `VITE_PUBLIC_SITE_URL`.
3. Deploy. `vercel.json` rewrites every path to `index.html`, so deep links such as
   `/r/<token>/signals` work.
4. In Supabase, go to **Authentication → URL Configuration** and add your Vercel domain.

## How things work

### Calculations (`src/lib/metrics.ts`)

- `aiReadiness = round(nap*0.25 + entity*0.25 + schema*0.15 + knowledge*0.10 + avg(engines)*0.25)`
- `consistentListings` counts sources with status `verified` or `synced`.
- `delta(cur, prev)` returns `null` for the first month. It renders as "New".
- Readiness level: 80 or more is Strong, 60 or more is Growing, 40 or more is Building, and anything lower is Foundation.
- `buildMonthStatement` returns `{lead, rest}` for the two-tone statements.
- `splitWeekly(weekly, seed)` is a deterministic 4×7 split of the weekly totals. Weekends get less
  weight, and each week sums exactly to its total.

### Screenshot export (`src/lib/export.ts`, `src/features/report/ReportDocument.tsx`)

- The Screenshot button renders the current section **offscreen at a fixed 1440px width**, through a
  portal inside the same report context. It then captures that node with
  `html-to-image` `toBlob({ pixelRatio: 3, width: 1440 })`. The PNG is therefore always 4320px wide
  and pixel-identical whatever the viewport size. This was verified at 1440 and 390.
- The layout uses **container queries**, not viewport media queries, so the 1440px offscreen copy
  always gets the desktop layout. The TopNav and Admin chrome are not part of the capture.
- Before capture, `data-capturing="true"` on `<html>` turns off animations and hides tooltips.
  The export waits for `document.fonts.ready` and two animation frames.
- Fonts are self-hosted (latin and latin-ext subsets, in `src/styles/fonts.css`), so `html-to-image`
  can inline them. Chart colors are resolved hex values from `src/lib/tokens.ts`.
- File names follow `{client-slug}_{section-slug}_{YYYY-MM}.png`.
- The PNG downloads straight away. A preview modal then offers **Copy image**, and falls back to a
  message if the browser blocks clipboard images.
- **Export full report (PDF)** is in the Admin client header and in the staff preview. It captures
  all 5 sections at pixelRatio 2 and builds one PDF page per section. Each page is as tall as its section.

### Admin autosave

The business info and monthly data forms autosave 600ms after the last change. The status reads
"Saved · HH:MM". Values are clamped to 0–100 where that applies. If building trust plus active
profiles is more than created, the form shows an inline warning. On screens 1440px or wider, a live
preview pane renders the client report with unsaved values.

### Client wording

The Community section in the client report uses neutral wording only: profiles, trust building,
community actions, reputation, communities reached. Internal labels such as "warm-up" and
"karma" appear only in the Admin.

## Project layout

```
src/
  app/                routes, demo + client report routes, styleguide
  components/ui/      primitives (Button, Tabs, SectionLabel, IndexTable, Kpi, Field, Slider…)
  components/charts/  Gauge, Ring, LineChart, StackedBars, Radar, Heatmap, Funnel, Sparkline, HBar
  features/report/    report context, frame, 5 sections, screenshot
  features/admin/     auth, client list, editor, month editor, share links, PDF export
  lib/                supabase client, api, metrics, export, format, tokens, demo data
  types/              Zod schemas + Supabase types
supabase/
  migrations/0001_init.sql
  functions/report/   Edge Function (signed logo URL)
  seed.sql            generated by `npm run seed:sql`
scripts/generate-seed.ts
```
