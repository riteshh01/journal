-- 001_init.sql: Initial schema for Personal Journal & Life Dashboard

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'dropped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  banner_text   VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL,
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  mood        SMALLINT CHECK (mood BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries (user_id, entry_date DESC);

CREATE TABLE IF NOT EXISTS goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     VARCHAR(50),
  priority     priority_level NOT NULL DEFAULT 'medium',
  status       goal_status NOT NULL DEFAULT 'active',
  progress     SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date  DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals (user_id, status);

CREATE TABLE IF NOT EXISTS media (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type         media_type NOT NULL,
  cloudinary_public_id TEXT NOT NULL UNIQUE,
  url                TEXT NOT NULL,
  thumbnail_url      TEXT,
  caption            VARCHAR(300),
  mime_type          VARCHAR(100) NOT NULL,
  size_bytes         BIGINT NOT NULL,
  journal_entry_id   UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  taken_on           DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_user_type ON media (user_id, media_type, created_at DESC);

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_journal_updated_at ON journal_entries;
CREATE TRIGGER trg_journal_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_goals_updated_at ON goals;
CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
