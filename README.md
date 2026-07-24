# MilGaya — Lost & Found

A community lost-and-found app: browse reported finds on a map for free, no account needed. Signing up is only
required to report a find or claim one. Ownership is verified with system-generated questions before finder and
claimer ever contact each other, and handover happens directly between the two of them over WhatsApp — MilGaya
never sends messages on your behalf and isn't part of the exchange itself.

## Stack

| Layer     | Technology                                    | Why                                    |
|-----------|------------------------------------------------|-----------------------------------------|
| Framework | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 | Server actions for all mutations, no separate API layer |
| Auth      | Better Auth (self-hosted, email + password)   | Runs inside Next.js, no external auth service |
| Database  | Neon serverless Postgres + PostGIS            | Real proximity search (`ST_DWithin` on a GIST index), scale-to-zero |
| Storage   | Cloudflare R2 (S3-compatible)                 | Photo storage, zero egress fees |
| Maps      | Leaflet.js + OpenStreetMap                    | No API key, no per-request cost |

## Features

- **Browse without an account** — map + list of reported finds, city picker or IP-based auto-detect (no
  location permission needed), or precise "use current location" with the browser's own prompt.
- **Report a find** — up to 3 photos with an in-browser blur brush (pixelation, not just soft blur — actually
  destroys the underlying detail) to redact identifying information before upload, auto-generated verification
  questions per category, fuzzed drop-pin location (~150m offset) so the exact spot is never public.
- **Claim a find** — answer the two verification questions; the finder reviews the answers plus the claimer's
  ID type/last-four digits before approving. Verification answers are encrypted at rest, not stored as plain text.
- **Handover** — once approved, a WhatsApp deep link opens between finder and claimer (either side can start the
  conversation); both sides confirm the handover independently before the item is marked returned.
- **Manage your own reports** — edit, review incoming claims, or delete a report yourself (only while it has no
  claims yet, so an in-progress or completed handover's history can't be destroyed).
- Installable PWA (manifest + service worker).

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database with the `postgis` extension available
- A [Cloudflare R2](https://dash.cloudflare.com) bucket (optional in dev — falls back to storing images as base64
  data URLs if R2 credentials aren't set)

### Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, BETTER_AUTH_SECRET, R2_* (see below)
```

Run `lib/schema.sql` against your Neon database once (via the Neon SQL editor or `psql`, connected as the
database owner) to create the tables, indexes, row-level security policies, the `refind_app` role, and seed the
category question bank. **Change the placeholder password** in the `CREATE ROLE refind_app` statement before
running it, or `ALTER ROLE refind_app WITH PASSWORD '...'` afterward.

`DATABASE_URL` must point at the `refind_app` role, **not** the database owner — table owners bypass row-level
security entirely, which would silently disable every access-control policy in `schema.sql`. Keep an owner
connection string around separately (e.g. as `DATABASE_URL_OWNER`, unused by app code) for future migrations.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string, connected as the `refind_app` role (see above) |
| `BETTER_AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | `http://localhost:3000` in dev |
| `ANSWER_ENCRYPTION_KEY` | No | Encrypts stored verification answers at rest. Falls back to `BETTER_AUTH_SECRET` if unset — set it explicitly in production so rotating the auth secret doesn't also break decryption of existing answers |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | No | Omit to store uploaded photos as inline base64 data URLs instead |

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build |
| `npm run lint` | ESLint |

## Project structure

```
app/
├── page.tsx                 # Explore — map + browse, city/IP-based location
├── auth/                    # Login / signup
├── items/
│   ├── new/                 # Report a find
│   ├── [id]/                # Public item detail + claim form
│   └── my/                  # Your reported items + management
├── claims/
│   ├── [id]/                # Claim review + WhatsApp handoff
│   └── my/                  # Your claim attempts
├── profile/                 # Account + logout
├── components/              # Shell (nav), map, photo picker/redactor, UI kit
└── actions/                 # Server actions — all mutations & queries live here
lib/
├── auth.ts, auth-client.ts  # Better Auth server/client instances
├── db.ts, schema.ts/.sql    # Drizzle ORM + raw DDL (RLS policies, app role, indexes)
├── crypto.ts                 # Encrypt/decrypt verification answers at rest
├── location.ts               # Haversine, coordinate fuzzing, popular-cities list
├── image-redaction.ts        # Client-side compression + pixelation blur
└── r2.ts                     # Cloudflare R2 upload (falls back to base64)
```

## Deploying

Works well on [Vercel](https://vercel.com) with a Neon database and an R2 bucket. Set the environment variables
above in your hosting provider's dashboard, and make sure `BETTER_AUTH_URL` matches your deployed origin.
