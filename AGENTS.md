<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ReFind — Lost & Found PWA

## Stack (Total: $0/month)

| Layer     | Technology                          | Free Tier Limits                |
|-----------|-------------------------------------|---------------------------------|
| Framework | Next.js 16 (App Router) + TS + Tailwind CSS 4 | Vercel Free         |
| Auth      | Better Auth (MIT, self-hosted)      | $0 — runs inside Next.js        |
| Database  | Neon (serverless PostgreSQL + PostGIS) | 0.5 GB, scale-to-zero        |
| Storage   | Cloudflare R2 (S3-compatible)       | 10 GB, zero egress, global CDN  |
| Maps      | Leaflet.js + OpenStreetMap          | $0 API costs                    |

## Core Philosophy

Browse freely (no auth). Auth required only for "Claim This" or "Report a Find".
Communication via WhatsApp deep links — no in-app chat, no QR codes.
System auto-generates verification questions per category.

## User Flows

**Finder (reports item):**
1. Tap "Report a Find" → prompted to signup/login
2. Upload photo → blur sensitive areas on canvas → done
3. Select category → system auto-generates 2 questions, finder provides correct answers
4. Drop pin on map (auto-fuzzed 150m) → submit

**Claimer (seeking lost item):**
1. Browse map/listings freely (no login)
2. Find matching item → tap "Claim This" → prompted to signup/login
3. Single-step signup: Name, Email, WhatsApp, Doc ID type+last 4 digits, Password
4. Answer 2 auto-generated verification questions

**Finder (reviewing claim):**
5. Sees claimer's answers + identity proof (doc type + last 4 digits)
6. Taps "Approve & Contact" → WhatsApp deep link opens
7. Both parties manually confirm handover → item marked "claimed"

## Database Schema (Neon PostgreSQL)

Better Auth manages `user`, `session`, `account` tables.

| Table                | Purpose              | Key Columns |
|----------------------|----------------------|-------------|
| `profiles`           | Extended user data   | `user_id`, `display_name`, `whatsapp_number`, `doc_type`, `doc_last_four` |
| `items`              | Found item listings  | `finder_id`, `title`, `category`, `description`, `image_url`, `fuzzed_location`, `raw_location` (restricted), `question_1`, `question_2`, `answer_1_hash`, `answer_2_hash`, `status` |
| `claims`             | Claim attempts       | `item_id`, `claimer_id`, `answer_1`, `answer_2`, `status`, `finder_confirmed`, `claimer_confirmed`, `resolved_at` |
| `category_questions` | System question bank | `category`, `question_text`, `active` |

## Route Structure

```
app/
├── layout.tsx                         ← Root: PWA meta, viewport, fonts
├── page.tsx                           ← Landing: map + item cards (public)
├── globals.css                        ← Design tokens + Tailwind
├── manifest.ts                        ← PWA manifest route
├── api/auth/[...all]/route.ts         ← Better Auth handler
├── auth/
│   ├── signup/page.tsx                ← Single-step form
│   └── login/page.tsx                 ← Email + password
├── items/
│   ├── new/page.tsx                   ← Report form (client canvas)
│   ├── [id]/page.tsx                  ← Public detail + auth gate
│   └── my/page.tsx                    ← My reported items (authed)
├── claims/
│   ├── [id]/page.tsx                  ← Claim review + approve/reject
│   └── my/page.tsx                    ← My claim attempts
├── components/
│   ├── ImageRedactor.tsx              ← Canvas blur UI
│   ├── MapView.tsx                    ← Leaflet map
│   ├── ClaimForm.tsx                  ← Answer submission
│   ├── AuthGate.tsx                   ← Auth wrapper
│   └── ui/                            ← Button, Card, Chip, Input, BottomSheet
└── lib/
    ├── auth.ts                        ← Better Auth instance
    ├── auth-client.ts                 ← Client-side auth
    ├── db.ts                          ← Neon + Drizzle ORM
    ├── r2.ts                          ← Cloudflare R2 upload
    ├── image-redaction.ts             ← Compress + canvas blur
    ├── location.ts                    ← Coordinate fuzzing
    ├── questions.ts                   ← Question bank + picker
    └── schema.sql                     ← DDL + RLS + seed
```

## Dependencies

```
better-auth drizzle-orm @neondatabase/serverless
@aws-sdk/client-s3 @aws-sdk/lib-storage
leaflet react-leaflet
```

Dev: `@types/leaflet drizzle-kit`

## Design Tokens

- bg: `#F7F8F9`, surface: `#FFFFFF`, ink: `#131517`, ink-soft: `#64666A`
- accent: `#2563EB` (trust blue), accent-soft: `#DBEAFE`
- success: `#10B981`, warning: `#F59E0B`
- line: `rgba(19,21,23,0.08)`, radius: `sm:8 md:14 lg:16 pill:9999px`
- font: system-ui sans-serif, no dark mode v1

## Key Rules

- Never use vibrant gradients — flat, calm, trust-focused palette
- Never require login to browse — auth only for actions
- Never expose raw locations or answer hashes publicly
- Always fuzz map pins by 150m
- Always compress images <200KB before upload
- All mutations via Server Actions, never direct client→DB