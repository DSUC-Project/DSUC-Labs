-- ===================================================
-- FIX RLS POLICIES FOR MEMBERS AND FINANCE_REQUESTS
-- Run this on Supabase SQL Editor
-- Date: December 3, 2025
-- ===================================================

-- ========================================
-- 1. FIX MEMBERS TABLE
-- ========================================

-- Drop all existing policies for members table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON members', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS for members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create public access policy (backend handles authentication)
CREATE POLICY "Public full access for members"
ON members FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify members policies
SELECT 
  '=== MEMBERS POLICIES ===' as info,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'members'
ORDER BY tablename, policyname;


-- ========================================
-- 2. FIX FINANCE_REQUESTS TABLE
-- ========================================

-- Drop all existing policies for finance_requests table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'finance_requests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON finance_requests', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS for finance_requests
ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public full access for finance_requests"
ON finance_requests FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify finance_requests policies
SELECT 
  '=== FINANCE_REQUESTS POLICIES ===' as info,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'finance_requests'
ORDER BY tablename, policyname;


-- ========================================
-- 3. FINAL VERIFICATION
-- ========================================

-- Check all policies
SELECT 
  '=== ALL POLICIES SUMMARY ===' as info,
  tablename,
  policyname,
  cmd,
  permissive,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename IN ('members', 'finance_requests')
ORDER BY tablename, policyname;

-- Check if tables have RLS enabled
SELECT
  '=== RLS STATUS ===' as info,
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('members', 'finance_requests')
ORDER BY tablename;

-- ========================================
-- NOTE: STORAGE BUCKET FOR AVATARS
-- ========================================
-- For avatar uploads to work, you need to configure storage bucket manually:
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket named "avatars" if not exists
-- 3. Make it PUBLIC:
--    - Click on avatars bucket
--    - Click "Configuration" or "Policies"
--    - Toggle "Public bucket" to ON
--    OR create a policy that allows public upload
-- 
-- Alternatively, backend can handle file upload to external services
-- like ImageBB, Cloudinary, etc.

-- ========================================
-- EXPECTED OUTPUT
-- ========================================
-- After running this script, you should see:
-- 
-- 1. MEMBERS POLICIES:
--    - "Public full access for members" (ALL operations, permissive)
--
-- 2. FINANCE_REQUESTS POLICIES:
--    - "Public full access for finance_requests" (ALL operations, permissive)
--
-- 3. RLS STATUS:
--    - members: RLS Enabled = true
--    - finance_requests: RLS Enabled = true
--
-- NOTE: Avatar storage must be configured separately via Supabase Dashboard
--
-- ========================================
-- ROLLBACK (If needed)
-- ========================================
-- If you need to rollback:
--
-- -- Disable RLS
-- ALTER TABLE members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE finance_requests DISABLE ROW LEVEL SECURITY;
--
-- -- Drop policies
-- DROP POLICY IF EXISTS "Public full access for members" ON members;
-- DROP POLICY IF EXISTS "Public full access for finance_requests" ON finance_requests;
