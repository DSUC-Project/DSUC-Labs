-- schema.sql for DSUC Lab
-- Creates tables and basic RLS policies so anon key cannot write.
-- Run this BEFORE seed.sql. Use policies.sql for more advanced policies if desired.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: set updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Members
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  wallet_address TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  bank_info JSONB,
  user_id UUID,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- If the table existed before without new columns, add them safely before creating indexes
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE members ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS bank_info JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS members_user_id_idx ON members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS members_wallet_idx ON members(wallet_address);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  repo_url TEXT,
  owner_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_tags_gin ON projects USING GIN (tags);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_at timestamptz,
  end_at timestamptz,
  location TEXT,
  attendees TEXT[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_attendees_gin ON events USING GIN (attendees);

-- Finance requests
CREATE TABLE IF NOT EXISTS finance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'VND',
  reason TEXT,
  bill_image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bounties
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  amount numeric(12,2) DEFAULT 0,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Repos
CREATE TABLE IF NOT EXISTS repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT,
  owner_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resources_tags_gin ON resources USING GIN (tags);

-- Triggers to auto-update updated_at
CREATE TRIGGER members_set_timestamp BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER projects_set_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER events_set_timestamp BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER finance_set_timestamp BEFORE UPDATE ON finance_requests FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER bounties_set_timestamp BEFORE UPDATE ON bounties FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER repos_set_timestamp BEFORE UPDATE ON repos FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER resources_set_timestamp BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS and safe default policies (blocks anon writes)

-- Members
ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS members_allow_select_public ON members;
CREATE POLICY members_allow_select_public ON members FOR SELECT USING (true);
DROP POLICY IF EXISTS members_allow_insert_auth ON members;
CREATE POLICY members_allow_insert_auth ON members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS members_allow_update_auth ON members;
CREATE POLICY members_allow_update_auth ON members FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS members_allow_delete_auth ON members;
CREATE POLICY members_allow_delete_auth ON members FOR DELETE USING (auth.role() = 'authenticated');

-- Projects
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS projects_allow_select_public ON projects;
CREATE POLICY projects_allow_select_public ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS projects_allow_insert_auth ON projects;
CREATE POLICY projects_allow_insert_auth ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS projects_allow_update_auth ON projects;
CREATE POLICY projects_allow_update_auth ON projects FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS projects_allow_delete_auth ON projects;
CREATE POLICY projects_allow_delete_auth ON projects FOR DELETE USING (auth.role() = 'authenticated');

-- Events
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_allow_select_public ON events;
CREATE POLICY events_allow_select_public ON events FOR SELECT USING (true);
DROP POLICY IF EXISTS events_allow_insert_auth ON events;
CREATE POLICY events_allow_insert_auth ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS events_allow_update_auth ON events;
CREATE POLICY events_allow_update_auth ON events FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS events_allow_delete_auth ON events;
CREATE POLICY events_allow_delete_auth ON events FOR DELETE USING (auth.role() = 'authenticated');

-- Finance requests (restrict read/write to authenticated users)
ALTER TABLE IF EXISTS finance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_allow_select_auth ON finance_requests;
CREATE POLICY finance_allow_select_auth ON finance_requests FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS finance_allow_insert_auth ON finance_requests;
CREATE POLICY finance_allow_insert_auth ON finance_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS finance_allow_update_auth ON finance_requests;
CREATE POLICY finance_allow_update_auth ON finance_requests FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS finance_allow_delete_auth ON finance_requests;
CREATE POLICY finance_allow_delete_auth ON finance_requests FOR DELETE USING (auth.role() = 'authenticated');

-- Bounties
ALTER TABLE IF EXISTS bounties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bounties_allow_select_public ON bounties;
CREATE POLICY bounties_allow_select_public ON bounties FOR SELECT USING (true);
DROP POLICY IF EXISTS bounties_allow_insert_auth ON bounties;
CREATE POLICY bounties_allow_insert_auth ON bounties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS bounties_allow_update_auth ON bounties;
CREATE POLICY bounties_allow_update_auth ON bounties FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS bounties_allow_delete_auth ON bounties;
CREATE POLICY bounties_allow_delete_auth ON bounties FOR DELETE USING (auth.role() = 'authenticated');

-- Repos
ALTER TABLE IF EXISTS repos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS repos_allow_select_public ON repos;
CREATE POLICY repos_allow_select_public ON repos FOR SELECT USING (true);
DROP POLICY IF EXISTS repos_allow_insert_auth ON repos;
CREATE POLICY repos_allow_insert_auth ON repos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS repos_allow_update_auth ON repos;
CREATE POLICY repos_allow_update_auth ON repos FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS repos_allow_delete_auth ON repos;
CREATE POLICY repos_allow_delete_auth ON repos FOR DELETE USING (auth.role() = 'authenticated');

-- Resources
ALTER TABLE IF EXISTS resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS resources_allow_select_public ON resources;
CREATE POLICY resources_allow_select_public ON resources FOR SELECT USING (true);
DROP POLICY IF EXISTS resources_allow_insert_auth ON resources;
CREATE POLICY resources_allow_insert_auth ON resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS resources_allow_update_auth ON resources;
CREATE POLICY resources_allow_update_auth ON resources FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS resources_allow_delete_auth ON resources;
CREATE POLICY resources_allow_delete_auth ON resources FOR DELETE USING (auth.role() = 'authenticated');

-- Finishing notes (comments only):
-- - This schema creates tables and default policies that prevent the anon key from performing writes.
-- - If you want owner-only updates, add user_id / owner_user_id UUID columns and create policies using auth.uid() checks.
-- - Run this file first, then run seed.sql. If you keep policies in a separate file, ensure both are applied.
