-- ===================================================
-- FIX STORAGE POLICIES FOR AVATARS BUCKET
-- Run this on Supabase SQL Editor AFTER fixing table RLS
-- Date: December 3, 2025
-- ===================================================

-- ========================================
-- IMPORTANT: Run fix_all_rls.sql FIRST!
-- ========================================
-- This script only fixes STORAGE policies
-- Make sure you've already run fix_all_rls.sql for table RLS

-- ========================================
-- 1. CHECK CURRENT STORAGE POLICIES
-- ========================================
SELECT 
  '=== CURRENT STORAGE POLICIES ===' as info,
  id,
  name,
  bucket_id,
  definition
FROM storage.policies
WHERE bucket_id = 'avatars';

-- ========================================
-- 2. DELETE ALL EXISTING STORAGE POLICIES
-- ========================================
-- This will remove any restrictive policies
DELETE FROM storage.policies WHERE bucket_id = 'avatars';

-- ========================================
-- 3. CREATE PUBLIC ACCESS POLICIES
-- ========================================

-- Allow anyone to SELECT (read/view) files
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Public Read Access',
  'avatars',
  'true',
  'SELECT'
);

-- Allow anyone to INSERT (upload) files
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Public Upload Access',
  'avatars',
  'true',
  'INSERT'
);

-- Allow anyone to UPDATE files
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Public Update Access',
  'avatars',
  'true',
  'UPDATE'
);

-- Allow anyone to DELETE files
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Public Delete Access',
  'avatars',
  'true',
  'DELETE'
);

-- ========================================
-- 4. VERIFY NEW POLICIES
-- ========================================
SELECT 
  '=== NEW STORAGE POLICIES ===' as info,
  id,
  name,
  bucket_id,
  operation,
  definition
FROM storage.policies
WHERE bucket_id = 'avatars'
ORDER BY operation;

-- ========================================
-- 5. CHECK BUCKET CONFIGURATION
-- ========================================
SELECT 
  '=== BUCKET CONFIG ===' as info,
  id,
  name,
  public
FROM storage.buckets
WHERE name = 'avatars';

-- If bucket is not public, make it public:
UPDATE storage.buckets 
SET public = true 
WHERE name = 'avatars';

-- Verify:
SELECT 
  '=== BUCKET CONFIG AFTER UPDATE ===' as info,
  id,
  name,
  public
FROM storage.buckets
WHERE name = 'avatars';

-- ========================================
-- EXPECTED OUTPUT
-- ========================================
-- After running this script, you should see:
-- 
-- 1. NEW STORAGE POLICIES (4 policies):
--    - Public Read Access (SELECT)
--    - Public Upload Access (INSERT)
--    - Public Update Access (UPDATE)
--    - Public Delete Access (DELETE)
--
-- 2. BUCKET CONFIG:
--    - name: avatars
--    - public: true
--
-- ========================================
-- TEST UPLOAD
-- ========================================
-- After running this script, test upload from backend:
-- 
-- curl -X PUT https://dsuc-labs-xmxl.onrender.com/api/members/101240059 \
--   -H "Content-Type: application/json" \
--   -H "x-wallet-address: FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm" \
--   -d '{
--     "name": "Zah",
--     "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
--   }'
--
-- Expected: Status 200, avatar URL returned
--
-- ========================================
-- ROLLBACK (If needed)
-- ========================================
-- If you need to rollback:
--
-- DELETE FROM storage.policies WHERE bucket_id = 'avatars';
-- UPDATE storage.buckets SET public = false WHERE name = 'avatars';
--
-- ========================================
-- ALTERNATIVE: USE DASHBOARD
-- ========================================
-- If SQL doesn't work, you can also:
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click on "avatars" bucket
-- 3. Click "Policies" tab
-- 4. Click "New Policy"
-- 5. Select "For full customization"
-- 6. Policy name: "Public Full Access"
-- 7. Allowed operations: SELECT ALL
-- 8. Target roles: public
-- 9. USING expression: true
-- 10. WITH CHECK expression: true
-- 11. Click "Review" then "Save Policy"
-- 
-- OR simply:
-- 1. Click "Configuration" tab
-- 2. Toggle "Public bucket" to ON
-- 3. Save
