-- Migration: Add Finance History & Luma Link
-- Run this on your Supabase SQL Editor to update existing database

-- 1. Add finance_history table for public transaction ledger
CREATE TABLE IF NOT EXISTS finance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  reason TEXT,
  date DATE,
  bill_image TEXT, -- URL ảnh bill/receipt
  status TEXT NOT NULL CHECK (status IN ('completed', 'rejected')),
  processed_by TEXT REFERENCES members(id) ON DELETE SET NULL,
  processed_by_name TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_history_status ON finance_history(status);
CREATE INDEX IF NOT EXISTS idx_finance_history_date ON finance_history(date DESC);

-- Enable RLS for finance_history (public read access)
ALTER TABLE finance_history ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read finance_history (public ledger)
CREATE POLICY "Public read access for finance_history"
ON finance_history FOR SELECT
TO public
USING (true);

-- Policy: Only authenticated users can insert (backend will handle this)
CREATE POLICY "Authenticated insert for finance_history"
ON finance_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Add luma_link column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS luma_link TEXT;

-- 3. Verify changes
SELECT 'finance_history table created' as status
UNION ALL
SELECT 'luma_link column added to events' as status;

-- 4. Show table structures
SELECT 
  'finance_history' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'finance_history'
ORDER BY ordinal_position;
