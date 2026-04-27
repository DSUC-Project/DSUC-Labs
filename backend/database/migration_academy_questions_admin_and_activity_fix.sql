-- Academy admin quiz management and reliable learning activity writes

CREATE TABLE IF NOT EXISTS academy_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track TEXT NOT NULL CHECK (track IN ('genin', 'chunin', 'jonin')),
  lesson_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_choice_id TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Published'
    CHECK (status IN ('Draft', 'Published', 'Archived')),
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_questions_lesson
  ON academy_questions(track, lesson_id, status, sort_order);

CREATE INDEX IF NOT EXISTS idx_academy_questions_status
  ON academy_questions(status);

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

CREATE INDEX IF NOT EXISTS idx_academy_progress_user
  ON academy_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_academy_progress_track
  ON academy_progress(track);

CREATE TABLE IF NOT EXISTS academy_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES members(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('genin', 'chunin', 'jonin')),
  lesson_id TEXT NOT NULL,
  action TEXT NOT NULL,
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_academy_questions_updated_at ON academy_questions;
CREATE TRIGGER update_academy_questions_updated_at BEFORE UPDATE ON academy_questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academy_progress_updated_at ON academy_progress;
CREATE TRIGGER update_academy_progress_updated_at BEFORE UPDATE ON academy_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Allow repeated study sessions to be recorded for streak/history.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'academy_activity'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%action%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE academy_activity DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE academy_activity
  ADD CONSTRAINT academy_activity_action_check
  CHECK (action IN (
    'started',
    'checklist_updated',
    'lesson_completed',
    'quiz_passed',
    'progress_updated',
    'lesson_reviewed'
  ));

-- Backend enforces auth/roles before using Supabase. These policies keep anon-key
-- backend deployments from being blocked by RLS when SERVICE_ROLE_KEY is not set.
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
