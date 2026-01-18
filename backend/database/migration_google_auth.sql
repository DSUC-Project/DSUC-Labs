-- Migration: Add Google Authentication Support
-- Run this migration after deploying the schema changes

-- Add new columns for Google auth to members table
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'wallet' CHECK (auth_provider IN ('wallet', 'google', 'both')),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_google_id ON members(google_id);

-- Comment explaining the auth_provider field:
-- 'wallet' = User registered with wallet only (original users)
-- 'google' = User registered with Google only (new flow)
-- 'both' = User has linked both wallet and Google account

-- Example: After user links their Google account
-- UPDATE members 
-- SET email = 'user@gmail.com', 
--     google_id = 'google_sub_id_here',
--     auth_provider = 'both',
--     email_verified = true
-- WHERE wallet_address = 'ABC...XYZ';
