-- Consolidated production migration for Google-first auth, community users,
-- admin status controls, work links, academy progress/history, and current UI enums.
-- Safe to run after older migrations: statements are idempotent where possible.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Members / auth / community accounts
ALTER TABLE members
  ALTER COLUMN wallet_address DROP NOT NULL;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS google_id TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'wallet',
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS academy_access BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT true;

UPDATE members
SET
  member_type = CASE WHEN member_type = 'community' THEN 'community' ELSE 'member' END,
  academy_access = COALESCE(academy_access, true),
  profile_completed = COALESCE(profile_completed, true),
  auth_provider = CASE
    WHEN wallet_address IS NOT NULL AND (google_id IS NOT NULL OR email IS NOT NULL) THEN 'both'
    WHEN wallet_address IS NOT NULL THEN 'wallet'
    ELSE 'google'
  END,
  role = CASE
    WHEN member_type = 'community' THEN 'Community'
    WHEN role IN ('President', 'Vice-President', 'Tech-Lead', 'Media-Lead', 'Member') THEN role
    ELSE 'Member'
  END;

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE members
  ADD CONSTRAINT members_role_check
  CHECK (role IN ('President', 'Vice-President', 'Tech-Lead', 'Media-Lead', 'Member', 'Community'));

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_member_type_check;
ALTER TABLE members
  ADD CONSTRAINT members_member_type_check
  CHECK (member_type IN ('member', 'community'));

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_auth_provider_check;
ALTER TABLE members
  ADD CONSTRAINT members_auth_provider_check
  CHECK (auth_provider IN ('wallet', 'google', 'both'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_email_unique
  ON members(email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_google_id_unique
  ON members(google_id)
  WHERE google_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_members_member_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_google_id ON members(google_id);

-- Content status controls
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE events ADD COLUMN IF NOT EXISTS luma_link TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE repos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';

UPDATE events
SET status = COALESCE(NULLIF(status, ''), 'Published');

UPDATE projects
SET status = CASE
  WHEN status IS NULL OR status = '' OR status = 'Active' THEN 'Published'
  WHEN status IN ('Draft', 'Published', 'Archived') THEN status
  ELSE 'Published'
END;

UPDATE repos
SET status = CASE
  WHEN status IS NULL OR status = '' THEN 'Published'
  WHEN status IN ('Draft', 'Published', 'Archived') THEN status
  ELSE 'Published'
END;

UPDATE resources
SET status = CASE
  WHEN status IS NULL OR status = '' THEN 'Published'
  WHEN status IN ('Draft', 'Published', 'Archived') THEN status
  ELSE 'Published'
END;

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('Draft', 'Published', 'Archived'));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('Draft', 'Published', 'Archived'));

ALTER TABLE repos DROP CONSTRAINT IF EXISTS repos_status_check;
ALTER TABLE repos
  ADD CONSTRAINT repos_status_check
  CHECK (status IN ('Draft', 'Published', 'Archived'));

ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_status_check;
ALTER TABLE resources
  ADD CONSTRAINT resources_status_check
  CHECK (status IN ('Draft', 'Published', 'Archived'));

-- Work links
ALTER TABLE bounties
  ADD COLUMN IF NOT EXISTS submit_link TEXT;

COMMENT ON COLUMN bounties.submit_link IS 'URL where users can submit their bounty solution';

-- Finance processing history used by the admin dashboard and public ledger.
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS processed_by TEXT REFERENCES members(id);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS finance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  reason TEXT,
  date DATE,
  bill_image TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'rejected')),
  processed_by TEXT REFERENCES members(id) ON DELETE SET NULL,
  processed_by_name TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_history_status ON finance_history(status);
CREATE INDEX IF NOT EXISTS idx_finance_history_date ON finance_history(date DESC);

-- Resource enums used by the current frontend.
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_type_check;
ALTER TABLE resources
  ADD CONSTRAINT resources_type_check
  CHECK (type IN ('Drive', 'Doc', 'Link', 'Document', 'Video'));

ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_category_check;
ALTER TABLE resources
  ADD CONSTRAINT resources_category_check
  CHECK (category IN ('Learning', 'Training', 'Document', 'Media', 'Hackathon', 'Tools', 'Research'));

-- Academy progress state
CREATE TABLE IF NOT EXISTS academy_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES members(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('genin', 'chunin', 'jonin')),
  lesson_id TEXT NOT NULL,
  lesson_completed BOOLEAN DEFAULT false,
  quiz_passed BOOLEAN DEFAULT false,
  checklist BOOLEAN[] DEFAULT '{}',
  xp_awarded INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_progress_user ON academy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_progress_track ON academy_progress(track);

-- Academy detailed learning history. Streak is calculated from recorded_at.
CREATE TABLE IF NOT EXISTS academy_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES members(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('genin', 'chunin', 'jonin')),
  lesson_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('started', 'checklist_updated', 'lesson_completed', 'quiz_passed', 'progress_updated')),
  lesson_completed BOOLEAN DEFAULT false,
  quiz_passed BOOLEAN DEFAULT false,
  checklist BOOLEAN[] DEFAULT '{}',
  xp_snapshot INT DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_activity_user ON academy_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_activity_recorded_at ON academy_activity(recorded_at DESC);

-- updated_at helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academy_progress_updated_at ON academy_progress;
CREATE TRIGGER update_academy_progress_updated_at BEFORE UPDATE ON academy_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
