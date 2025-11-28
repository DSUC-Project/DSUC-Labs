-- Row Level Security (RLS) policies for DSUC Lab
-- Purpose: prevent anonymous (anon) key from performing writes while allowing server (service role) and authenticated users as appropriate.

-- IMPORTANT: service_role key bypasses RLS automatically; keep it server-side only.

-- Members table
ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS members_allow_select_public ON members FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS members_allow_insert_auth ON members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS members_allow_update_auth ON members FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS members_allow_delete_auth ON members FOR DELETE USING (auth.role() = 'authenticated');

-- Projects (public read, auth write)
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS projects_allow_select_public ON projects FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS projects_allow_insert_auth ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS projects_allow_update_auth ON projects FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS projects_allow_delete_auth ON projects FOR DELETE USING (auth.role() = 'authenticated');

-- Events (public read, auth write)
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS events_allow_select_public ON events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS events_allow_insert_auth ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS events_allow_update_auth ON events FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS events_allow_delete_auth ON events FOR DELETE USING (auth.role() = 'authenticated');

-- Finance requests (restrict read/write to authenticated users only)
ALTER TABLE IF EXISTS finance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS finance_allow_select_auth ON finance_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS finance_allow_insert_auth ON finance_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS finance_allow_update_auth ON finance_requests FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS finance_allow_delete_auth ON finance_requests FOR DELETE USING (auth.role() = 'authenticated');

-- Bounties (public read, auth write)
ALTER TABLE IF EXISTS bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS bounties_allow_select_public ON bounties FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS bounties_allow_insert_auth ON bounties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS bounties_allow_update_auth ON bounties FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS bounties_allow_delete_auth ON bounties FOR DELETE USING (auth.role() = 'authenticated');

-- Repos (public read, auth write)
ALTER TABLE IF EXISTS repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS repos_allow_select_public ON repos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS repos_allow_insert_auth ON repos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS repos_allow_update_auth ON repos FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS repos_allow_delete_auth ON repos FOR DELETE USING (auth.role() = 'authenticated');

-- Resources (public read, auth write)
ALTER TABLE IF EXISTS resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS resources_allow_select_public ON resources FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS resources_allow_insert_auth ON resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS resources_allow_update_auth ON resources FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS resources_allow_delete_auth ON resources FOR DELETE USING (auth.role() = 'authenticated');

-- Recommended: owner-only policies (optional)
-- If you want users to be able to modify only their own member row, you need a stable mapping
-- between a Supabase authenticated user (auth.uid()) and a members row. A common approach is
-- to add a `user_id UUID` column on `members` that stores the Supabase auth user's id (jwt sub).
-- Example migration to add the column:
-- ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID;
-- ALTER TABLE members ADD CONSTRAINT members_user_id_unique UNIQUE (user_id);

-- Example owner-only policy for members (requires members.user_id to exist):
-- CREATE POLICY IF NOT EXISTS members_update_owner ON members
--   FOR UPDATE
--   USING (auth.role() = 'authenticated' AND auth.uid() = user_id)
--   WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Example owner-only policy for finance_requests (if you add requester_user_id UUID):
-- ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY IF NOT EXISTS finance_requests_owner_only ON finance_requests
--   FOR ALL
--   USING (auth.role() = 'authenticated' AND auth.uid() = requester_user_id)
--   WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = requester_user_id);

-- Notes and alternatives:
-- - If you don't want to use Supabase Auth, you can keep the simpler "authenticated" checks shown above
--   and perform authentication/authorization on the server (service role) side. The service role key
--   bypasses RLS, so server endpoints should validate signatures/nonces and then call Supabase with
--   the service role key to perform writes.
-- - Do not expose the service_role key to the frontend.
-- - If you need more fine-grained rules (e.g. allow project owners to edit their projects), add an
--   owner column to the table (owner_user_id UUID) and create a similar policy that checks auth.uid() = owner_user_id.

-- Quick checklist for maintainers:
-- 1) Decide whether frontend users will sign-in via Supabase Auth (recommended) or via wallet-signatures + server validation.
-- 2) If using Supabase Auth, add user_id columns (UUID) to domain tables that require owner-based policies and create policies like the examples above.
-- 3) If using wallet-signature auth, keep server endpoints responsible for writes and keep the service_role key server-side.
-- 4) Test policies in Supabase SQL Editor and remember service_role bypasses RLS during server-side operations.
