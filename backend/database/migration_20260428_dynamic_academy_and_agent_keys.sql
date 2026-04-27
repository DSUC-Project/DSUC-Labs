-- Dynamic Academy + Agent Admin API Keys
-- This migration intentionally resets old academy data so new tracks/lessons can be rebuilt from scratch.

CREATE TABLE IF NOT EXISTS academy_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Published'
    CHECK (status IN ('Draft', 'Published', 'Archived')),
  sort_order INT DEFAULT 0,
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_tracks_status_sort
  ON academy_tracks(status, sort_order);

CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track TEXT NOT NULL REFERENCES academy_tracks(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  minutes INT DEFAULT 10,
  content_md TEXT DEFAULT '',
  callouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Published'
    CHECK (status IN ('Draft', 'Published', 'Archived')),
  sort_order INT DEFAULT 0,
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(track, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_lessons_track_sort
  ON academy_lessons(track, status, sort_order);

CREATE TABLE IF NOT EXISTS admin_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] DEFAULT ARRAY['*']::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES members(id),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_api_keys_active
  ON admin_api_keys(is_active);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_academy_tracks_updated_at ON academy_tracks;
CREATE TRIGGER update_academy_tracks_updated_at BEFORE UPDATE ON academy_tracks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academy_lessons_updated_at ON academy_lessons;
CREATE TRIGGER update_academy_lessons_updated_at BEFORE UPDATE ON academy_lessons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_api_keys_updated_at ON admin_api_keys;
CREATE TRIGGER update_admin_api_keys_updated_at BEFORE UPDATE ON admin_api_keys
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
DECLARE
  progress_track_check TEXT;
  activity_track_check TEXT;
  question_track_check TEXT;
BEGIN
  SELECT conname INTO progress_track_check
  FROM pg_constraint
  WHERE conrelid = 'academy_progress'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%track IN (%';

  IF progress_track_check IS NOT NULL THEN
    EXECUTE format('ALTER TABLE academy_progress DROP CONSTRAINT %I', progress_track_check);
  END IF;

  SELECT conname INTO activity_track_check
  FROM pg_constraint
  WHERE conrelid = 'academy_activity'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%track IN (%';

  IF activity_track_check IS NOT NULL THEN
    EXECUTE format('ALTER TABLE academy_activity DROP CONSTRAINT %I', activity_track_check);
  END IF;

  SELECT conname INTO question_track_check
  FROM pg_constraint
  WHERE conrelid = 'academy_questions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%track IN (%';

  IF question_track_check IS NOT NULL THEN
    EXECUTE format('ALTER TABLE academy_questions DROP CONSTRAINT %I', question_track_check);
  END IF;
END $$;

ALTER TABLE academy_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access for academy_progress" ON academy_progress;
CREATE POLICY "Public full access for academy_progress"
  ON academy_progress FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE academy_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access for academy_activity" ON academy_activity;
CREATE POLICY "Public full access for academy_activity"
  ON academy_activity FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE academy_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access for academy_questions" ON academy_questions;
CREATE POLICY "Public full access for academy_questions"
  ON academy_questions FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE academy_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access for academy_tracks" ON academy_tracks;
CREATE POLICY "Public full access for academy_tracks"
  ON academy_tracks FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access for academy_lessons" ON academy_lessons;
CREATE POLICY "Public full access for academy_lessons"
  ON academy_lessons FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE admin_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access for admin_api_keys" ON admin_api_keys;
CREATE POLICY "Public full access for admin_api_keys"
  ON admin_api_keys FOR ALL
  USING (true)
  WITH CHECK (true);

-- User explicitly requested to discard old fixed academy setup.
TRUNCATE TABLE academy_activity, academy_progress, academy_questions RESTART IDENTITY;
TRUNCATE TABLE academy_lessons, academy_tracks RESTART IDENTITY CASCADE;
