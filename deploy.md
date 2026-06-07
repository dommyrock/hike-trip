# Deploying hike-trip to Cloudflare

**Live:** <https://hike-trip.dominik-polzer.workers.dev>

Single Cloudflare **Worker** (not classic Pages): `dist/` served as static assets
(free, unmetered), `worker/index.js` answers `/api/*` from **D1**. Config lives in
`wrangler.toml`. Everything below runs from the repo root.

## Prerequisites

- Node + npm, `npm install` done (wrangler is a devDependency)
- A Cloudflare account (free tier is enough)

## One-time setup

### 1. Authenticate

```bash
npx wrangler login        # opens browser OAuth
npx wrangler whoami       # verify
```

### 2. Create the production D1 database

```bash
npx wrangler d1 create hike_trip
```

Prints a `database_id` (UUID).

### 3. Paste the ID into `wrangler.toml`

```toml
[[d1_databases]]
binding = "DB"
database_name = "hike_trip"
database_id = "<uuid-from-step-2>"   # replaces REPLACE-AFTER-wrangler-d1-create
```

### 4. Apply schema + seed to production D1

```bash
npm run db:apply:remote
```

Runs `db/schema.sql` then `db/seed.sql` against the remote DB (asks for
confirmation). **Destructive**: drops and reseeds all tables — correct for first
deploy, see "Updating trail data" before re-running later.

### 5. Build + deploy

```bash
npm run deploy            # astro build && wrangler deploy
```

Prints the live URL: `https://hike-trip.dominik-polzer.workers.dev`
(`dominik-polzer` is the account-wide workers.dev subdomain; on a different
account this part will differ — see "Replicating" below.)

### 6. Verify

```bash
curl 'https://hike-trip.dominik-polzer.workers.dev/api/trails?origin=ortisei'
```

Must return JSON rows from D1 (not an error — the client silently falls back to
bundled data, so check the API directly, not just the page). Then open the URL
in a browser and confirm the map renders.

## How code & data ship (separate tracks)

```
                       ┌─ npm run deploy ──────────────────────────┐
trails.js ──build──►   │  dist/ (static assets) + worker/index.js  │ ──► Cloudflare
                       │  wrangler.toml just BINDS the existing    │
                       │  remote DB by database_id — no data I/O   │
                       └───────────────────────────────────────────┘

                       ┌─ npm run db:apply:remote ─────────────────┐
trails.js ──db:seed:gen──► db/seed.sql ──► │ executes schema.sql + seed.sql        │ ──► remote D1
                       │  as SQL statements over the CF API        │
                       └───────────────────────────────────────────┘
```

`npm run deploy` **never touches D1 data** — it uploads code and re-attaches the
binding; the remote DB keeps whatever rows it has. Data only changes when
`db:apply:remote` explicitly executes SQL against it (drop + reseed from
`seed.sql`, which is generated from `trails.js`). Local D1 (`.wrangler/state/`)
and remote D1 never sync in either direction — both are disposable projections
of `trails.js`, the real source of truth.

## Recurring tasks

| Task | Command |
|---|---|
| Ship code/content changes | `npm run deploy` |
| Update trail data | edit `src/data/trails.js` → `npm run db:seed:gen` → `npm run db:apply:remote` → `npm run deploy` (client fallback bundle must match D1) |
| Full-stack local preview | `npm run preview:cf` (local D1 on :8787) |
| Inspect prod DB | `npx wrangler d1 execute hike_trip --remote --command 'SELECT slug,name FROM trails'` |
| Tail prod logs | `npx wrangler tail hike-trip` |

## Replicating to a new account / fresh clone

Repeat steps 1–6. Note step 2 issues a **new** `database_id` — update
`wrangler.toml` accordingly (the ID is account-specific; committing it is fine,
it's not a secret).

## Custom domain

### What's possible with the URL

- `hike-trip.dominik-polzer.workers.dev` — the free default. Format is fixed:
  `<worker-name>.<account-subdomain>.workers.dev`; the middle label **cannot be
  removed**, so `hike-trip.workers.dev` is not a thing.
- The account subdomain CAN be changed to something shorter (dashboard →
  Workers & Pages → right sidebar → "Your subdomain" → Change), but it's
  **account-wide**: all Workers move, and old URLs stop resolving.
- A real domain like `hike-trip.dev` requires registering it. Both
  `hike-trip.dev` and `hiketrip.dev` were unregistered as of 2026-06-06
  (check: `curl -sL -o /dev/null -w "%{http_code}" https://rdap.org/domain/hike-trip.dev`
  → 404 = available). `.dev` is ~$10–12/yr at Cloudflare Registrar (sells at
  wholesale cost).

### Attaching a domain to the Worker

1. **Register / add the domain**: dashboard → Domain Registration → Register
   Domain. Bought through Cloudflare Registrar it's added to the account with
   nameservers already set (an externally-registered domain must first be added
   as a zone and its nameservers pointed at Cloudflare).
2. **Attach as Custom Domain** — either:
   - dashboard: Worker → Settings → Domains & Routes → Add → Custom Domain, or
   - `wrangler.toml`:

     ```toml
     routes = [
       { pattern = "hike-trip.dev", custom_domain = true }
     ]
     ```

     then `npm run deploy`.
3. Cloudflare provisions the TLS cert automatically. `.dev` is an
   HSTS-preloaded TLD (browsers force HTTPS) — no extra config needed.
4. The `*.workers.dev` URL keeps working alongside the custom domain. To kill
   it: Worker → Settings → Domains & Routes → disable the workers.dev route
   (or `workers_dev = false` in `wrangler.toml`).

## Tweaks

- **Auto-deploy from GitHub** (currently CLI-only by choice): dashboard →
  Workers & Pages → hike-trip → Settings → Build → connect the repo; pushes to
  `main` then build + deploy automatically.
- **Rename the Worker**: change `name` in `wrangler.toml` — next deploy creates
  a new Worker; delete the old one in the dashboard.

## Gotchas

- `wrangler.toml` `run_worker_first = ["/api/*"]` is what keeps static requests
  off the Worker (free). Don't remove it when touching the `[assets]` block.
- `db/seed.sql` is generated from `src/data/trails.js` — never edit by hand.
- `db:apply:remote` drops + reseeds; there is no migration story. Fine while
  data is code-defined; revisit if user-generated data ever lands in D1.
- Local dev D1 (`.wrangler/`) and prod D1 are completely separate — seeding one
  does nothing to the other.
