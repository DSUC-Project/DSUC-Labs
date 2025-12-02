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

-- Drop ALL existing policies for projects
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'projects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', pol.policyname);
    END LOOP;
END $$;

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

-- Drop ALL existing policies for resources
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'resources'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON resources', pol.policyname);
    END LOOP;
END $$;

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

-- Drop ALL existing policies for bounties
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'bounties'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON bounties', pol.policyname);
    END LOOP;
END $$;

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

-- Drop ALL existing policies for finance_history
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'finance_history'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON finance_history', pol.policyname);
    END LOOP;
END $$;

-- This table already has correct RLS from previous migration
-- Just verify it's enabled
ALTER TABLE finance_history ENABLE ROW LEVEL SECURITY;

-- Ensure public read access exists
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
