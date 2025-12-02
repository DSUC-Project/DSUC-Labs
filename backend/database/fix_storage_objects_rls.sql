-- ===================================================
-- FIX STORAGE.OBJECTS RLS - WORKING VERSION
-- Run this on Supabase SQL Editor
-- Date: December 3, 2025
-- ===================================================

-- ========================================
-- DISABLE RLS ON STORAGE.OBJECTS TABLE
-- ========================================
-- This is the table that actually stores file metadata
-- RLS on this table is blocking uploads even when bucket is public

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFY
-- ========================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Expected output: rowsecurity = false (RLS disabled)

-- ========================================
-- IF YOU NEED TO RE-ENABLE (ROLLBACK)
-- ========================================
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
