# Rank Orbit — AI Visibility Dashboard

A client-facing AI Search / AI Overview visibility report for Rank Orbit LLC. Staff enter
monthly numbers in the Admin and view the finished report in the staff preview. The AI report is
**3 pages**, each sized to fit one Word page, in the same colors and font as the Rank Orbit Word report
(white, black, Montserrat, cyan→purple gradient). Copy a page and paste it into the monthly GMB + AI Word
report, or download PNGs or a PDF.
The whole site is private behind one password. See [Privacy and access](#privacy-and-access).

**Stack:** React 18 · Vite · TypeScript (strict) · Tailwind CSS v3 · React Router v6 ·
TanStack Query · Zod · Supabase (Postgres, Storage) via server functions · Vercel Middleware ·
hand-built SVG charts ·
`html-to-image` · `jspdf` · self-hosted `@fontsource` fonts.

## Routes

| Route | What it is |
|---|---|
| `/demo/:client/:page?` | The report with local demo data (`summit`, `harbor`). Pages: `summary`, `signals`, `community`. `?m=YYYY-MM` picks a month. No Supabase needed. |
| `/admin` | Client list. |
| `/admin/clients/:id` | Client editor: Business info · Monthly data. |
| `/admin/clients/:id/preview/:page?` | The 3-page report for a client, including draft months. Copy / PNG / PDF export live here. |

## Privacy and access

Nothing in this project is public. There are no user accounts and no shareable client links.

- **One password unlocks everything.** Anyone who opens any address on the site (`/`, `/admin`,
  `/demo`, a JS file, an image) first gets a password screen. That screen contains no app code and
  no data. Only the correct `SITE_PASSWORD` gets past it.
- **The check happens on the server**, in Vercel Middleware (`middleware.ts`), before any file is
  served. It does not depend on code in the browser.
- **The session** is a signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookie (`__Host-ro_session`).
  Page scripts can't read it. It expires after `SESSION_HOURS` (default 12). Changing
  `SITE_PASSWORD` or `SESSION_SECRET` signs everyone out at once.
- **Brute force:** after 10 wrong passwords from one IP within 15 minutes, that IP is locked out
  for 15 minutes. Each wrong attempt is also slowed down.
- **The browser never talks to the database.** All reads and writes go through `/api/rpc`. That
  endpoint re-checks the session on every call and uses the Supabase service key, which exists only
  on the server. In the database, the public `anon` and `authenticated` roles are denied
  everything (migration `0002`). A leaked Supabase URL or anon key gives no access.
- **Fail closed:** if `SITE_PASSWORD` (12+ characters) or `SESSION_SECRET` (32+ characters) is
  missing, the site stays locked and shows "not configured". It never opens up.
- Search engines are told not to index anything (`X-Robots-Tag`, `robots.txt`).
- **Lock** in the Admin header signs out the current browser.

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
SITE_PASSWORD=a-long-passphrase-you-choose
SESSION_SECRET=paste-a-random-32+-character-string
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Generate a `SESSION_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

```bash
npm run dev
```

Open http://localhost:5173 and enter the password. The same password gate and API run in the dev
server. `/demo` shows the report with demo data and needs no database.

Other scripts:

| Script | Does |
|---|---|
| `npm run build` | Type-checks (`tsc -b`) and builds to `dist/` |
| `npm test` | Runs the Vitest suites (metrics and the password gate) |
| `npm run typecheck` | Type-checks only |
| `npm run seed:sql` | Regenerates `supabase/seed.sql` from `src/lib/demo.ts` |

## Supabase

### 1. Run the migrations

Open your project's **SQL Editor** and run, in order:

1. `supabase/migrations/0001_init.sql`: creates the tables and the private `logos` bucket.
2. `supabase/migrations/0002_private_password_gate.sql`: removes every access path for the public
   `anon` and `authenticated` roles. Only the server's service key can read or write data.

Both files are safe to run again. If you already ran an older `0001`, just run `0002`.

### 2. Seed the demo clients (optional)

Run `supabase/seed.sql` in the SQL Editor. It adds the two demo clients from the mockup
(Summit Peak Plumbing & Drain with 5 months, and Harbor Line Dental Studio with 3 months).

### 3. Keys

In **Project Settings → API**, copy the project URL and the **service_role** (secret) key into
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The anon key isn't used anywhere. The Supabase
Auth users page isn't used either, because there are no accounts.

## Deploy to Vercel

1. Import the repository in Vercel. The framework preset is **Vite**: the build command is
   `npm run build` and the output directory is `dist`.
2. In **Settings → Environment Variables**, add `SITE_PASSWORD`, `SESSION_SECRET`, `SUPABASE_URL`
   and `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SESSION_HOURS`) for Production *and* Preview.
   Don't give any of them a `VITE_` prefix.
3. Deploy. `middleware.ts` locks every route. `api/*.ts` are the login, logout and data functions.
   `vercel.json` sends app routes to `index.html` and adds security headers.
4. Open the site in a private window and check that you see only the password screen.

Preview deployments run the same middleware, so they are locked too. For a second layer, you can
also turn on **Vercel Authentication** under **Settings → Deployment Protection**. That makes
Vercel require your Vercel login before the password screen.

## How things work

### Calculations (`src/lib/metrics.ts`)

- `aiReadiness = round(nap*0.25 + entity*0.25 + schema*0.15 + knowledge*0.10 + avg(engines)*0.25)`
- `consistentListings` counts sources with status `verified` or `synced`.
- `delta(cur, prev)` returns `null` for the first month. It renders as "New".
- Readiness level: 80 or more is Strong, 60 or more is Growing, 40 or more is Building, and anything lower is Foundation.
- `buildMonthStatement` returns `{lead, rest}` for the two-tone statements.
- `splitWeekly(weekly, seed)` is a deterministic 4×7 split of the weekly totals. Weekends get less
  weight, and each week sums exactly to its total.

### The 3 report pages

| Page | Contents |
|---|---|
| 1. AI Visibility Summary | AI Readiness score, 4 key metrics, monthly statement, visibility trend, AI engine readiness, work delivered + highlight |
| 2. AI Search Signals | NAP accuracy by field, listing consistency (status counts + directory table, up to 14), entity building |
| 3. Community & Monthly Progress | Community phase + authority, profiles, platform coverage, month-to-month table (last 6 months), milestones |

Each page is a fixed 960 × 1240 px sheet, the same shape as 6.5in × 8.4in. That's the content area
of a Letter page with 1in side margins, leaving room for the Word report's own logo header and
footer. Exports are captured at 3× (2880 × 3720 px), which stays sharp in Word.

### Exports (`src/features/report/ExportBar.tsx`, `src/lib/export.ts`)

- **Copy page** puts the current page on the clipboard as a PNG. In Word, click where it should
  go and press Ctrl+V, then set the picture width to 6.5in if needed.
- **Download PNG** saves the current page. **All 3 pages** saves all three PNGs.
- **PDF** builds a Letter-size PDF, one page per report page, with 1in margins.
- File names look like `ridge-runner-construction_1-ai-visibility-summary_2026-10.png`.
- Pages are rendered offscreen at their fixed size, so the output is identical on any screen.
  Fonts are self-hosted and inlined. Chart colors are resolved hex values from `src/lib/tokens.ts`.

### Sending a report to a client

1. **New client** (once per client): enter the name and category, then fill in **Business info**.
   It is saved permanently and stays for every future month.
2. **Every month:** open the client, go to **Monthly data** and press **+ Add month**. Pick the report
   month. "Copy of <latest month>" is selected by default, so every number, listing and community
   value is carried over and you only change what moved. Opening a client always shows its latest
   month exactly as you left it. Older months stay in the **Month** list.
3. Press **Save month**. Changes also autosave about half a second after you stop typing.
4. Open **Preview client view**, then **Copy page** for each of the 3 pages and paste them into the
   Word report (or download PNG / PDF).

### Changing the password

Update `SITE_PASSWORD` in Vercel and redeploy. Every existing session stops working immediately.

### Admin autosave

The business info and monthly data forms autosave 600ms after the last change, and the **Save client**
and **Save month** buttons save immediately. The status reads "Saved to database · HH:MM"
("Unsaved changes" while typing), and the browser warns before closing a tab with unsaved changes. Values are clamped to 0–100 where that applies. If building trust plus active
profiles is more than created, the form shows an inline warning. On screens 1440px or wider, a live
preview pane renders the client report with unsaved values.

### Client wording

The Community section in the client report uses neutral wording only: profiles, trust building,
community actions, reputation, communities reached. Internal labels such as "warm-up" and
"karma" appear only in the Admin.

## Project layout

```
src/
  app/                routes, demo report route, styleguide
  components/ui/      primitives (Button, Tabs, SectionLabel, IndexTable, Kpi, Field, Slider…)
  components/charts/  Gauge, Ring, LineChart, StackedBars, Radar, Heatmap, Funnel, Sparkline, HBar
  features/report/    report context, 3 fixed-size pages, sheet frame, exports
  features/admin/     client list, editor, month editor, PDF export
  lib/                api (calls /api/rpc), metrics, export, format, tokens, demo data
  types/              Zod schemas
server/               password gate, session cookies, login rate limit, data API (server-only)
api/                  Vercel functions: login, logout, rpc
middleware.ts         Vercel Middleware: locks every route
supabase/
  migrations/0001_init.sql, 0002_private_password_gate.sql
  seed.sql            generated by `npm run seed:sql`
scripts/generate-seed.ts
```
