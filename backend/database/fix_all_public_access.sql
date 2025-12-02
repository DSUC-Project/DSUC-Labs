-- Fix Projects & Resources RLS Policies
-- Run this on your Supabase SQL Editor to ensure everyone can see all projects and resources

-- ============================================
-- PROJECTS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public read access - everyone can see ALL projects
CREATE POLICY "Public read access for projects"
ON projects FOR SELECT
TO public
USING (true);

-- Anyone can create projects via API
CREATE POLICY "Anyone can create projects"
ON projects FOR INSERT
TO public
WITH CHECK (true);

-- Creator can update their own projects
CREATE POLICY "Creator can update own projects"
ON projects FOR UPDATE
TO public
USING (created_by::text = (current_setting('request.headers', true)::json->>'x-wallet-address'));

-- Creator can delete their own projects
CREATE POLICY "Creator can delete own projects"
ON projects FOR DELETE
TO public
USING (created_by::text = (current_setting('request.headers', true)::json->>'x-wallet-address'));

-- ============================================
-- RESOURCES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can create resources" ON resources;
DROP POLICY IF EXISTS "Users can update own resources" ON resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON resources;

-- Ensure RLS is enabled
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public read access - everyone can see ALL resources
CREATE POLICY "Public read access for resources"
ON resources FOR SELECT
TO public
USING (true);

-- Anyone can create resources via API
CREATE POLICY "Anyone can create resources"
ON resources FOR INSERT
TO public
WITH CHECK (true);

-- Creator can update their own resources
CREATE POLICY "Creator can update own resources"
ON resources FOR UPDATE
TO public
USING (created_by::text = (current_setting('request.headers', true)::json->>'x-wallet-address'));

-- Creator can delete their own resources
CREATE POLICY "Creator can delete own resources"
ON resources FOR DELETE
TO public
USING (created_by::text = (current_setting('request.headers', true)::json->>'x-wallet-address'));

-- ============================================
-- BOUNTIES TABLE (Work/Bounties)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view bounties" ON bounties;
DROP POLICY IF EXISTS "Authenticated users can create bounties" ON bounties;
DROP POLICY IF EXISTS "Users can update own bounties" ON bounties;
DROP POLICY IF EXISTS "Admins can delete bounties" ON bounties;

-- Ensure RLS is enabled
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Public read access - everyone can see ALL bounties
CREATE POLICY "Public read access for bounties"
ON bounties FOR SELECT
TO public
USING (true);

-- Anyone can create bounties via API
CREATE POLICY "Anyone can create bounties"
ON bounties FOR INSERT
TO public
WITH CHECK (true);

-- Anyone can update bounties (for claiming)
CREATE POLICY "Anyone can update bounties"
ON bounties FOR UPDATE
TO public
WITH CHECK (true);

-- Creator can delete their own bounties
CREATE POLICY "Creator can delete own bounties"
ON bounties FOR DELETE
TO public
USING (created_by::text = (current_setting('request.headers', true)::json->>'x-wallet-address'));

-- Verify changes
SELECT 'projects' as table_name, policyname, cmd FROM pg_policies WHERE tablename = 'projects'
UNION ALL
SELECT 'resources' as table_name, policyname, cmd FROM pg_policies WHERE tablename = 'resources'
UNION ALL
SELECT 'bounties' as table_name, policyname, cmd FROM pg_policies WHERE tablename = 'bounties'
UNION ALL
SELECT 'events' as table_name, policyname, cmd FROM pg_policies WHERE tablename = 'events'
ORDER BY table_name, cmd;
