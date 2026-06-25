-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  notes            TEXT DEFAULT '',
  source           TEXT DEFAULT '',
  team             TEXT DEFAULT '',
  setter           TEXT DEFAULT '',
  closer           TEXT DEFAULT '',
  setter_status    TEXT DEFAULT 'pending',
  closer_status    TEXT DEFAULT '',
  whatsapp_added   BOOLEAN DEFAULT FALSE,
  t1 BOOLEAN DEFAULT FALSE,
  t2 BOOLEAN DEFAULT FALSE,
  t3 BOOLEAN DEFAULT FALSE,
  t4 BOOLEAN DEFAULT FALSE,
  t5 BOOLEAN DEFAULT FALSE,
  t6 BOOLEAN DEFAULT FALSE,
  appointment_date TEXT DEFAULT '',
  created_at       TEXT DEFAULT '',
  qualified_at     TEXT DEFAULT '',
  called_dates     TEXT[] DEFAULT '{}',
  batch_id         UUID,
  assigned_date    TEXT DEFAULT '',
  assigned_at      TEXT DEFAULT '',
  handoff_status   TEXT DEFAULT '',
  handoff_at       TEXT DEFAULT '',
  handoff_note     TEXT DEFAULT '',
  handoff_by       TEXT DEFAULT '',
  accepted_at      TEXT DEFAULT ''
);

-- Lead batches table
CREATE TABLE IF NOT EXISTS lead_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label         TEXT NOT NULL,
  team          TEXT NOT NULL,
  setter        TEXT DEFAULT '',
  closer        TEXT DEFAULT '',
  source        TEXT DEFAULT '',
  lead_count    INT DEFAULT 0,
  assigned_date TEXT DEFAULT '',
  assigned_at   TEXT DEFAULT '',
  uploaded_by   TEXT DEFAULT '',
  origin        TEXT DEFAULT 'upload'
);

-- Replacements table
CREATE TABLE IF NOT EXISTS replacements (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              UUID,
  lead_name            TEXT DEFAULT '',
  reason               TEXT DEFAULT '',
  setter               TEXT DEFAULT '',
  pair                 TEXT DEFAULT '',
  status               TEXT DEFAULT 'open',
  created_at           TEXT DEFAULT '',
  auto_fulfilled       BOOLEAN DEFAULT FALSE,
  fulfilled_at         TEXT DEFAULT '',
  fulfillment_note     TEXT DEFAULT '',
  replacement_lead_id  UUID,
  replacement_name     TEXT DEFAULT '',
  replacement_phone    TEXT DEFAULT '',
  replacement_source   TEXT DEFAULT '',
  pool_entry_id        UUID
);

-- Pool entries table
CREATE TABLE IF NOT EXISTS pool_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  source           TEXT DEFAULT '',
  status           TEXT DEFAULT 'available',
  added_by         TEXT DEFAULT '',
  added_at         TEXT DEFAULT '',
  assigned_to_pair TEXT DEFAULT '',
  assigned_at      TEXT DEFAULT ''
);

-- Setter data requests table
CREATE TABLE IF NOT EXISTS setter_data_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setter          TEXT DEFAULT '',
  team            TEXT DEFAULT '',
  requested_day   TEXT DEFAULT '',
  reason          TEXT DEFAULT '',
  requested_count INT DEFAULT 0,
  status          TEXT DEFAULT 'pending',
  created_at      TEXT DEFAULT '',
  fulfilled_at    TEXT DEFAULT '',
  fulfilled_count INT DEFAULT 0,
  admin_note      TEXT DEFAULT ''
);

-- Indexes
CREATE INDEX IF NOT EXISTS leads_team_idx ON leads(team);
CREATE INDEX IF NOT EXISTS leads_setter_idx ON leads(setter);
CREATE INDEX IF NOT EXISTS leads_batch_id_idx ON leads(batch_id);
CREATE INDEX IF NOT EXISTS lead_batches_team_idx ON lead_batches(team);
