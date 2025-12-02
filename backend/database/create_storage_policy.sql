-- ===================================================
-- CREATE POLICY FOR STORAGE.OBJECTS
-- Alternative when you can't disable RLS
-- Run this on Supabase SQL Editor
-- Date: December 3, 2025
-- ===================================================

-- ========================================
-- CREATE PUBLIC ACCESS POLICY
-- ========================================
-- This allows all operations on storage.objects

CREATE POLICY "Public Storage Access - Allow All"
ON storage.objects
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ========================================
-- VERIFY POLICY WAS CREATED
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Expected: See the new policy "Public Storage Access - Allow All"

-- ========================================
-- IF POLICY ALREADY EXISTS (ERROR)
-- ========================================
-- Drop existing and recreate:
-- DROP POLICY IF EXISTS "Public Storage Access - Allow All" ON storage.objects;
-- Then run CREATE POLICY above again
