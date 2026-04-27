-- DSUC Lab Database Schema
-- Designed for Supabase PostgreSQL with Solana wallet authentication

-- 1. Bảng Members (Thông tin thành viên)
-- Quan trọng:
-- - id là mã số sinh viên (student ID) để URL đẹp: /member/101240059
-- - wallet_address là duy nhất và dùng để authentication
CREATE TABLE members (
  id TEXT PRIMARY KEY, -- Mã số sinh viên (Student ID)
  wallet_address TEXT UNIQUE, -- Solana wallet address (Phantom/Solflare)
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('President', 'Vice-President', 'Tech-Lead', 'Media-Lead', 'Member', 'Community')),
  member_type TEXT NOT NULL DEFAULT 'member' CHECK (member_type IN ('member', 'community')),
  avatar TEXT, -- Lưu URL ảnh
  skills TEXT[] DEFAULT '{}', -- Mảng chuỗi: ['React', 'Rust']
  socials JSONB DEFAULT '{}', -- { "github": "...", "twitter": "...", "telegram": "...", "facebook": "..." }
  bank_info JSONB DEFAULT '{}', -- { "bankId": "970422", "accountNo": "000...", "accountName": "..." }
  email TEXT UNIQUE,
  google_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'wallet' CHECK (auth_provider IN ('wallet', 'google', 'both')),
  email_verified BOOLEAN DEFAULT false,
  academy_access BOOLEAN DEFAULT true,
  profile_completed BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index cho tìm kiếm nhanh
CREATE INDEX idx_members_wallet ON members(wallet_address);
CREATE INDEX idx_members_role ON members(role);

-- 2. Bảng Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  type TEXT DEFAULT 'Workshop',
  location TEXT,
  attendees INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
  luma_link TEXT, -- Link to Luma event registration
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(date DESC);

-- 3. Bảng Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
  builders TEXT[] DEFAULT '{}', -- Mảng tên người làm
  link TEXT, -- Demo link
  repo_link TEXT, -- GitHub repo
  image_url TEXT, -- Project image
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_category ON projects(category);

-- 4. Bảng Finance Requests
CREATE TABLE finance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id TEXT REFERENCES members(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL, -- Cache tên để đỡ query lại
  amount TEXT NOT NULL,
  reason TEXT,
  date DATE,
  bill_image TEXT, -- URL ảnh minh chứng
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  processed_by TEXT REFERENCES members(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_finance_status ON finance_requests(status);
CREATE INDEX idx_finance_requester ON finance_requests(requester_id);

-- 4b. Bảng Finance History (Public record of all transactions)
CREATE TABLE finance_history (
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

CREATE INDEX idx_finance_history_status ON finance_history(status);
CREATE INDEX idx_finance_history_date ON finance_history(date DESC);

-- 5. Bảng Bounties
CREATE TABLE bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Closed')),
  submit_link TEXT,
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bounties_status ON bounties(status);

-- 6. Bảng Repos
CREATE TABLE repos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  url TEXT, -- GitHub repo URL
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng Resources
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Drive', 'Doc', 'Link', 'Document', 'Video')),
  url TEXT NOT NULL,
  size TEXT,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
  category TEXT CHECK (category IN ('Learning', 'Training', 'Document', 'Media', 'Hackathon', 'Tools', 'Research')),
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_category ON resources(category);

-- 8. Bảng Academy Progress (user learning state)
CREATE TABLE academy_progress (
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

CREATE INDEX idx_academy_progress_user ON academy_progress(user_id);
CREATE INDEX idx_academy_progress_track ON academy_progress(track);

-- 9. Bảng Academy Activity (detailed learning history)
CREATE TABLE academy_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES members(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('genin', 'chunin', 'jonin')),
  lesson_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('started', 'checklist_updated', 'lesson_completed', 'quiz_passed', 'progress_updated', 'lesson_reviewed')),
  lesson_completed BOOLEAN DEFAULT false,
  quiz_passed BOOLEAN DEFAULT false,
  checklist BOOLEAN[] DEFAULT '{}',
  xp_snapshot INT DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_academy_activity_user ON academy_activity(user_id);
CREATE INDEX idx_academy_activity_recorded_at ON academy_activity(recorded_at DESC);

-- 10. Bảng Academy Questions (admin-managed quiz bank)
CREATE TABLE academy_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track TEXT NOT NULL CHECK (track IN ('genin', 'chunin', 'jonin')),
  lesson_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_choice_id TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
  created_by TEXT REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_academy_questions_lesson ON academy_questions(track, lesson_id, status, sort_order);
CREATE INDEX idx_academy_questions_status ON academy_questions(status);

-- Function để tự động update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger cho bảng members
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho bảng academy_progress
CREATE TRIGGER update_academy_progress_updated_at BEFORE UPDATE ON academy_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho bảng academy_questions
CREATE TRIGGER update_academy_questions_updated_at BEFORE UPDATE ON academy_questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
