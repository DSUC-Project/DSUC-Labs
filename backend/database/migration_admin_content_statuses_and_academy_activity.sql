-- Add content status controls for admin management

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Published'
    CHECK (status IN ('Draft', 'Published', 'Archived'));

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Published'
    CHECK (status IN ('Draft', 'Published', 'Archived'));

ALTER TABLE repos
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Published'
    CHECK (status IN ('Draft', 'Published', 'Archived'));

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Published'
    CHECK (status IN ('Draft', 'Published', 'Archived'));

UPDATE events
SET status = COALESCE(status, 'Published');

UPDATE projects
SET status = CASE
  WHEN status IS NULL OR status = '' OR status = 'Active' THEN 'Published'
  ELSE status
END;

UPDATE repos
SET status = COALESCE(status, 'Published');

UPDATE resources
SET status = COALESCE(status, 'Published');

-- Add academy learning history table
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

CREATE INDEX IF NOT EXISTS idx_academy_activity_user
  ON academy_activity(user_id);

CREATE INDEX IF NOT EXISTS idx_academy_activity_recorded_at
  ON academy_activity(recorded_at DESC);
