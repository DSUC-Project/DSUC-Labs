-- Fix Events RLS Policy
-- Run this on your Supabase SQL Editor to ensure everyone can see all events

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- Ensure RLS is enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read access - everyone can see ALL events
CREATE POLICY "Public read access for events"
ON events FOR SELECT
TO public
USING (true);

-- Policy 2: Authenticated users can create events (but anyone can create via API)
CREATE POLICY "Anyone can create events"
ON events FOR INSERT
TO public
WITH CHECK (true);

-- Policy 3: Creator can update their own events
CREATE POLICY "Creator can update own events"
ON events FOR UPDATE
TO public
USING (created_by::text = (current_setting('request.headers', true)::json->>'x-wallet-address'));

-- Policy 4: Creator can delete their own events
CREATE POLICY "Creator can delete own events"
ON events FOR DELETE
TO public
USING (created_by::text = (current_setting('request.headers', true)::json->>'x-wallet-address'));

-- Verify changes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'events'
ORDER BY policyname;
