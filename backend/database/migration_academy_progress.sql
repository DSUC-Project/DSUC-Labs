-- Academy progress persistence
-- Run this on existing databases that already use schema.sql

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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_academy_progress_updated_at ON academy_progress;
CREATE TRIGGER update_academy_progress_updated_at BEFORE UPDATE ON academy_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
