CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Better Auth core tables ──────────────────────────────

CREATE TABLE "user" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  image         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "session" (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at           TIMESTAMPTZ NOT NULL,
  token                TEXT NOT NULL UNIQUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address           TEXT,
  user_agent           TEXT,
  user_id              UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE "account" (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            TEXT NOT NULL,
  provider_id           TEXT NOT NULL,
  user_id               UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token          TEXT,
  refresh_token         TEXT,
  id_token              TEXT,
  access_token_expires_at  TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope                 TEXT,
  password              TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "verification" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_user ON "session" (user_id);
CREATE INDEX idx_account_user ON "account" (user_id);

-- ── App tables ──────────────────────────────────────────────

CREATE TABLE profiles (
  id          UUID PRIMARY KEY,
  display_name  TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  doc_type    TEXT NOT NULL DEFAULT '' CHECK (doc_type IN ('', 'aadhaar', 'dl', 'passport', 'voter', 'other')),
  doc_last_four TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finder_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('phone', 'laptop', 'wallet', 'keys', 'documents', 'bag', 'clothing', 'footwear', 'jewelry', 'glasses', 'watch', 'headphones', 'waterbottle', 'umbrella', 'toy', 'other')),
  description   TEXT NOT NULL DEFAULT '',
  image_url     TEXT NOT NULL DEFAULT '',
  image_urls    JSONB NOT NULL DEFAULT '[]'::jsonb,
  location_name TEXT NOT NULL DEFAULT '',
  fuzzed_location GEOGRAPHY(Point, 4326) NOT NULL,
  raw_location  GEOGRAPHY(Point, 4326) NOT NULL,
  question_1    TEXT NOT NULL,
  question_2    TEXT NOT NULL,
  answer_1      TEXT NOT NULL DEFAULT '',
  answer_2      TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_fuzzed_location ON items USING GIST (fuzzed_location);
CREATE INDEX idx_items_status ON items (status);
CREATE INDEX idx_items_finder ON items (finder_id);

CREATE TABLE claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_1        TEXT NOT NULL DEFAULT '',
  answer_2        TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  finder_confirmed  BOOLEAN NOT NULL DEFAULT false,
  claimer_confirmed BOOLEAN NOT NULL DEFAULT false,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, claimer_id)
);

CREATE INDEX idx_claims_item ON claims (item_id);
CREATE INDEX idx_claims_claimer ON claims (claimer_id);

CREATE TABLE category_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL CHECK (category IN ('phone', 'laptop', 'wallet', 'keys', 'documents', 'bag', 'clothing', 'footwear', 'jewelry', 'glasses', 'watch', 'headphones', 'waterbottle', 'umbrella', 'toy', 'other')),
  question_text TEXT NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT true
);

-- ── Seed questions ───────────────────────────────────────────

INSERT INTO category_questions (category, question_text) VALUES
('phone', 'What brand is it?'),
('phone', 'Any distinctive scratches or stickers?'),
('phone', 'What color is it?'),
('phone', 'What is the approximate model or year?'),
('phone', 'Does it have a case or cover?'),
('documents', 'What is the name on the document?'),
('documents', 'What type of document is it?'),
('documents', 'What is the issuing authority?'),
('documents', 'Any distinctive markings or stamps?'),
('documents', 'What is the document number ending in? (last 3 digits)'),
('jewelry', 'What brand is it?'),
('jewelry', 'What material is it made of?'),
('jewelry', 'What color is it?'),
('jewelry', 'Any unique charms or attachments?'),
('jewelry', 'Approximate size or dimensions?'),
('keys', 'How many keys are on the keychain?'),
('keys', 'Any distinctive keychain or charm?'),
('keys', 'What color is the keychain?'),
('keys', 'Any brand name on the keys?'),
('keys', 'What type of keys are they? (car, house, padlock)'),
('clothing', 'What brand is it?'),
('clothing', 'What size is it?'),
('clothing', 'What color is it?'),
('clothing', 'Any distinctive patterns or logos?'),
('clothing', 'What material or fabric?'),
('other', 'What color is it?'),
('other', 'Any unique markings or identifiers?'),
('other', 'What material is it?'),
('other', 'Approximate size or dimensions?'),
('other', 'Any distinctive features?');

-- ── Row-Level Security ───────────────────────────────────────
-- Enable RLS on all tables. FORCE means it also applies to the tables' owner —
-- without FORCE, RLS is silently bypassed by whichever role owns the tables,
-- which is exactly the role the app used to connect as.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE items FORCE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims FORCE ROW LEVEL SECURITY;
ALTER TABLE category_questions ENABLE ROW LEVEL SECURITY;

-- profiles: owner-only for writes (kept from before)
CREATE POLICY profiles_owner ON profiles
  FOR ALL USING (id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (id = current_setting('app.current_user_id', true)::uuid);

-- profiles: display name + WhatsApp/doc info are shown across users once a
-- claim links them (finder <-> claimer), and finder name is shown publicly on
-- item pages — so reads are public; profiles_owner above still gates writes.
CREATE POLICY profiles_public_select ON profiles FOR SELECT USING (true);

-- profiles: insert allowed for new signups
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (true);

-- items: public SELECT (fuzzed + public columns only; raw_location and reference answers excluded by column grants)
CREATE POLICY items_public_select ON items FOR SELECT USING (true);

-- items: finder full access
CREATE POLICY items_finder_all ON items FOR ALL
  USING (finder_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (finder_id = current_setting('app.current_user_id', true)::uuid);

-- items: insert for authenticated finders
CREATE POLICY items_finder_insert ON items FOR INSERT
  WITH CHECK (finder_id = current_setting('app.current_user_id', true)::uuid);

-- claims: publicly visible on the item detail page (status + claimer name),
-- same as items — the app itself narrows which columns get selected there.
CREATE POLICY claims_public_select ON claims FOR SELECT USING (true);

-- claims: finder sees claims on own items
CREATE POLICY claims_finder_select ON claims FOR SELECT
  USING (item_id IN (
    SELECT id FROM items WHERE finder_id = current_setting('app.current_user_id', true)::uuid
  ));

-- claims: claimer sees own claims
CREATE POLICY claims_claimer_select ON claims FOR SELECT
  USING (claimer_id = current_setting('app.current_user_id', true)::uuid);

-- claims: claimer can insert
CREATE POLICY claims_claimer_insert ON claims FOR INSERT
  WITH CHECK (claimer_id = current_setting('app.current_user_id', true)::uuid);

-- claims: finder can update status on claims of own items
CREATE POLICY claims_finder_update ON claims FOR UPDATE
  USING (item_id IN (
    SELECT id FROM items WHERE finder_id = current_setting('app.current_user_id', true)::uuid
  ))
  WITH CHECK (item_id IN (
    SELECT id FROM items WHERE finder_id = current_setting('app.current_user_id', true)::uuid
  ));

-- claims: claimer can update own confirmed
CREATE POLICY claims_claimer_update ON claims FOR UPDATE
  USING (claimer_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (claimer_id = current_setting('app.current_user_id', true)::uuid);

-- claims: finder can delete claims on own items (needed so deleting an item
-- can cascade-delete its rejected claims — DELETE has no implicit policy)
CREATE POLICY claims_finder_delete ON claims FOR DELETE
  USING (item_id IN (
    SELECT id FROM items WHERE finder_id = current_setting('app.current_user_id', true)::uuid
  ));

-- category_questions: public read
CREATE POLICY category_questions_select ON category_questions FOR SELECT USING (true);

-- ── Column-level grants: restrict raw_location from the app's own role ──
-- (answer_1/answer_2 must stay readable by the app role — it decrypts and
-- displays them to the finder during claim review.)

REVOKE SELECT (raw_location) ON items FROM PUBLIC;

-- ── App role ───────────────────────────────────────────────
-- The app MUST connect as this role, not as the table owner — table owners
-- bypass RLS entirely (including FORCE ROW LEVEL SECURITY above), which would
-- silently disable every policy defined in this file. Change the password
-- before running this against a real database.

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'refind_app') THEN
    CREATE ROLE refind_app WITH LOGIN PASSWORD 'change-me';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO refind_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "user", "session", "account", "verification" TO refind_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles, items, claims TO refind_app;
GRANT SELECT ON category_questions TO refind_app;