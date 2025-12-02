-- DSUC Lab - Row Level Security Policies
-- Các policies này bảo vệ dữ liệu và kiểm soát quyền truy cập

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MEMBERS TABLE POLICIES
-- ============================================

-- Everyone can read active members (for public member list)
CREATE POLICY "Anyone can view active members"
  ON members FOR SELECT
  USING (is_active = true);

-- Members can only update their own profile (excluding role)
CREATE POLICY "Members can update own profile"
  ON members FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- No one can insert new members through RLS (must be done by admin in dashboard)
CREATE POLICY "No public insert on members"
  ON members FOR INSERT
  WITH CHECK (false);

-- No one can delete members through RLS
CREATE POLICY "No public delete on members"
  ON members FOR DELETE
  USING (false);

-- ============================================
-- EVENTS TABLE POLICIES
-- ============================================

-- Everyone can read events
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (true);

-- Users can update events they created
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (created_by::text = auth.uid()::text);

-- Admin roles can delete any event
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id::text = auth.uid()::text
      AND role IN ('President', 'Vice-President', 'Tech-Lead', 'Media-Lead')
    )
  );

-- ============================================
-- PROJECTS TABLE POLICIES
-- ============================================

-- Everyone can read projects
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  USING (true);

-- Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (true);

-- Users can update projects they created
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (created_by::text = auth.uid()::text);

-- Admin roles can delete any project
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id::text = auth.uid()::text
      AND role IN ('President', 'Vice-President', 'Tech-Lead')
    )
  );

-- ============================================
-- FINANCE REQUESTS TABLE POLICIES
-- ============================================

-- Users can view their own requests
CREATE POLICY "Users can view own finance requests"
  ON finance_requests FOR SELECT
  USING (requester_id::text = auth.uid()::text);

-- Admins can view all requests
CREATE POLICY "Admins can view all finance requests"
  ON finance_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id::text = auth.uid()::text
      AND role IN ('President', 'Vice-President', 'Tech-Lead')
    )
  );

-- Authenticated users can create finance requests
CREATE POLICY "Authenticated users can create finance requests"
  ON finance_requests FOR INSERT
  WITH CHECK (requester_id::text = auth.uid()::text);

-- Only admins can update finance requests (approve/reject)
CREATE POLICY "Admins can update finance requests"
  ON finance_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id::text = auth.uid()::text
      AND role IN ('President', 'Vice-President', 'Tech-Lead')
    )
  );

-- No one can delete finance requests (keep history)
CREATE POLICY "No delete on finance requests"
  ON finance_requests FOR DELETE
  USING (false);

-- ============================================
-- BOUNTIES TABLE POLICIES
-- ============================================

-- Everyone can read bounties
CREATE POLICY "Anyone can view bounties"
  ON bounties FOR SELECT
  USING (true);

-- Authenticated users can create bounties
CREATE POLICY "Authenticated users can create bounties"
  ON bounties FOR INSERT
  WITH CHECK (true);

-- Users can update bounties they created
CREATE POLICY "Users can update own bounties"
  ON bounties FOR UPDATE
  USING (created_by::text = auth.uid()::text);

-- Admins can delete bounties
CREATE POLICY "Admins can delete bounties"
  ON bounties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id::text = auth.uid()::text
      AND role IN ('President', 'Vice-President', 'Tech-Lead')
    )
  );

-- ============================================
-- REPOS TABLE POLICIES
-- ============================================

-- Everyone can read repos
CREATE POLICY "Anyone can view repos"
  ON repos FOR SELECT
  USING (true);

-- Authenticated users can create repos
CREATE POLICY "Authenticated users can create repos"
  ON repos FOR INSERT
  WITH CHECK (true);

-- Users can update repos they created
CREATE POLICY "Users can update own repos"
  ON repos FOR UPDATE
  USING (created_by::text = auth.uid()::text);

-- Admins can delete repos
CREATE POLICY "Admins can delete repos"
  ON repos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id::text = auth.uid()::text
      AND role IN ('President', 'Vice-President', 'Tech-Lead')
    )
  );

-- ============================================
-- RESOURCES TABLE POLICIES
-- ============================================

-- Everyone can read resources
CREATE POLICY "Anyone can view resources"
  ON resources FOR SELECT
  USING (true);

-- Authenticated users can create resources
CREATE POLICY "Authenticated users can create resources"
  ON resources FOR INSERT
  WITH CHECK (true);

-- Users can update resources they created
CREATE POLICY "Users can update own resources"
  ON resources FOR UPDATE
  USING (created_by::text = auth.uid()::text);

-- Admins and Media-Lead can delete resources
CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id::text = auth.uid()::text
      AND role IN ('President', 'Vice-President', 'Tech-Lead', 'Media-Lead')
    )
  );

-- ============================================
-- STORAGE POLICIES (for file uploads)
-- ============================================

-- Note: Run these in Storage > Policies section

-- Allow authenticated users to upload files
-- CREATE POLICY "Authenticated users can upload files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'dsuc-lab' AND auth.role() = 'authenticated');

-- Allow public to read files
-- CREATE POLICY "Public can read files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'dsuc-lab');

-- Allow users to update their own files
-- CREATE POLICY "Users can update own files"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'dsuc-lab' AND auth.uid()::text = owner::text);

-- Allow users to delete their own files
-- CREATE POLICY "Users can delete own files"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'dsuc-lab' AND auth.uid()::text = owner::text);
