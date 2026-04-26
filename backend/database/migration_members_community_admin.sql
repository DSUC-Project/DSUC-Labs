-- Extend members for community accounts, Google-only login, and academy access control

ALTER TABLE members
  ALTER COLUMN wallet_address DROP NOT NULL;

ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_role_check;

ALTER TABLE members
  ADD CONSTRAINT members_role_check
  CHECK (role IN ('President', 'Vice-President', 'Tech-Lead', 'Media-Lead', 'Member', 'Community'));

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS member_type TEXT NOT NULL DEFAULT 'member'
    CHECK (member_type IN ('member', 'community')),
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'wallet'
    CHECK (auth_provider IN ('wallet', 'google', 'both')),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS academy_access BOOLEAN DEFAULT true;

UPDATE members
SET
  member_type = COALESCE(member_type, 'member'),
  academy_access = COALESCE(academy_access, true),
  auth_provider = CASE
    WHEN wallet_address IS NOT NULL AND google_id IS NOT NULL THEN 'both'
    WHEN wallet_address IS NOT NULL THEN 'wallet'
    ELSE COALESCE(auth_provider, 'google')
  END,
  role = CASE
    WHEN member_type = 'community' THEN 'Community'
    ELSE role
  END;
