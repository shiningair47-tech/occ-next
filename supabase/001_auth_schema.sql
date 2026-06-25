-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  email        TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'setter', 'closer')),
  team         TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  temp_password BOOLEAN NOT NULL DEFAULT TRUE,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  name       TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  token        TEXT PRIMARY KEY,
  current_email TEXT NOT NULL,
  preview_role  TEXT NOT NULL DEFAULT '',
  preview_email TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Helper: verify password
CREATE OR REPLACE FUNCTION crypt_check(plain TEXT, hashed TEXT)
RETURNS BOOLEAN AS $$
  SELECT hashed = crypt(plain, hashed);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper: hash password
CREATE OR REPLACE FUNCTION hash_password(plain TEXT)
RETURNS TEXT AS $$
  SELECT crypt(plain, gen_salt('bf', 12));
$$ LANGUAGE SQL SECURITY DEFINER;

-- Seed teams
INSERT INTO teams (name) VALUES
  ('Pair Aurora'),
  ('Pair Vanguard'),
  ('Pair Horizon'),
  ('Pair Polaris'),
  ('Pair Stellar'),
  ('Pair Nova')
ON CONFLICT DO NOTHING;

-- Seed demo users (passwords hashed)
INSERT INTO users (email, name, role, team, password_hash, temp_password, active)
VALUES
  ('shiningair47@gmail.com',              'Aarav Mehta',  'admin',  'Operations HQ', hash_password('@Arik9999'),   FALSE, TRUE),
  ('priya.shah@shiningoverseas.local',    'Priya Shah',   'setter', 'Pair Aurora',   hash_password('Setter@2025'), FALSE, TRUE),
  ('rohan.kapoor@shiningoverseas.local',  'Rohan Kapoor', 'closer', 'Pair Aurora',   hash_password('Closer@2025'), FALSE, TRUE)
ON CONFLICT DO NOTHING;
