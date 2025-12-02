-- Migration: Add submit_link to bounties table
-- Run this in Supabase SQL editor

ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS submit_link TEXT;

COMMENT ON COLUMN bounties.submit_link IS 'URL where users can submit their bounty solution';
