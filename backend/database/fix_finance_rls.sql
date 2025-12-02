-- Fix RLS for finance_requests table
-- Run this on Supabase SQL Editor

-- Drop existing policies
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

-- Enable RLS
ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;

-- Public full access (since backend handles auth)
CREATE POLICY "Public full access for finance_requests"
ON finance_requests FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'finance_requests'
ORDER BY tablename, policyname;
