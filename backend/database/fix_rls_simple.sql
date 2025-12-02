-- Simple RLS Fix - Public Access for All Content
-- Run this on Supabase SQL Editor
-- This version works without wallet authentication headers

-- ============================================
-- EVENTS TABLE
-- ============================================

-- Drop ALL existing policies for events
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON events', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Simple policies: Everyone can do everything via API
CREATE POLICY "Public full access for events"
ON events FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- PROJECTS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Public read access for projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Creator can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Creator can delete own projects" ON projects;

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Simple policies: Everyone can do everything via API
CREATE POLICY "Public full access for projects"
ON projects FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- RESOURCES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view resources" ON resources;
DROP POLICY IF EXISTS "Public read access for resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can create resources" ON resources;
DROP POLICY IF EXISTS "Anyone can create resources" ON resources;
DROP POLICY IF EXISTS "Users can update own resources" ON resources;
DROP POLICY IF EXISTS "Creator can update own resources" ON resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON resources;
DROP POLICY IF EXISTS "Creator can delete own resources" ON resources;

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Simple policies: Everyone can do everything via API
CREATE POLICY "Public full access for resources"
ON resources FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- BOUNTIES TABLE (Work page)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view bounties" ON bounties;
DROP POLICY IF EXISTS "Public read access for bounties" ON bounties;
DROP POLICY IF EXISTS "Authenticated users can create bounties" ON bounties;
DROP POLICY IF EXISTS "Anyone can create bounties" ON bounties;
DROP POLICY IF EXISTS "Users can update own bounties" ON bounties;
DROP POLICY IF EXISTS "Anyone can update bounties" ON bounties;
DROP POLICY IF EXISTS "Admins can delete bounties" ON bounties;
DROP POLICY IF EXISTS "Creator can delete own bounties" ON bounties;

-- Enable RLS
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Simple policies: Everyone can do everything via API
CREATE POLICY "Public full access for bounties"
ON bounties FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- FINANCE_HISTORY TABLE (Already fixed before)
-- ============================================

-- This table already has correct RLS from previous migration
-- Just verify it's enabled
ALTER TABLE finance_history ENABLE ROW LEVEL SECURITY;

-- Ensure public read access exists
DROP POLICY IF EXISTS "Public read access for finance_history" ON finance_history;
CREATE POLICY "Public read access for finance_history"
ON finance_history FOR SELECT
TO public
USING (true);

-- ============================================
-- VERIFY ALL POLICIES
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename IN ('events', 'projects', 'resources', 'bounties', 'finance_history')
ORDER BY tablename, policyname;
