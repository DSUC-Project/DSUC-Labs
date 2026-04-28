export interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  memberType?: 'member' | 'community';
  member_type?: 'member' | 'community';
  academyAccess?: boolean;
  academy_access?: boolean;
  is_active?: boolean;
  socials: {
    github?: string;
    twitter?: string;
    telegram?: string;
    facebook?: string;
  };
  bankInfo?: {
    bankId: string;
    accountNo: string;
    accountName?: string;
  };
  // Backend uses snake_case, map these for compatibility
  bank_info?: {
    bankId: string;
    accountNo: string;
    accountName?: string;
  };
  // Google auth fields
  email?: string;
  google_id?: string;
  auth_provider?: 'wallet' | 'google' | 'both';
  email_verified?: boolean;
  wallet_address?: string | null;
  profile_completed?: boolean;
  streak?: number;
  builds?: number;
  academyRank?: string;
}

// Auth method type
export type AuthMethod = 'wallet' | 'google';
export type AuthIntent = 'login' | 'signup';

// Google user info from OAuth
export interface GoogleUserInfo {
  email: string;
  google_id: string;
  name: string;
  avatar: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "Workshop" | "Hackathon" | "Social";
  location: string;
  attendees: number;
  status?: PublishStatus;
  luma_link?: string; // Backend snake_case
}

export type PublishStatus = "Draft" | "Published" | "Archived";

export interface Bounty {
  id: string;
  title: string;
  reward: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  status: "Open" | "In Progress" | "Completed" | "Closed";
  submitLink?: string; // Optional link to submit bounty solution
}

export interface Repo {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  status?: PublishStatus;
  repoLink?: string; // GitHub/GitLab repo URL
}

export type ResourceCategory =
  | "Learning"
  | "Training"
  | "Document"
  | "Media"
  | "Hackathon";

export interface Resource {
  id: string;
  name: string;
  type: "Drive" | "Doc" | "Link" | "Document" | "Video";
  url: string;
  size?: string;
  status?: PublishStatus;
  category: ResourceCategory;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

export interface FinanceRequest {
  id: string;
  amount: string;
  reason: string;
  date: string;
  billImage: string | null;
  status: "pending" | "completed" | "rejected";
  requesterName: string;
  requesterId: string; // Linked to Member ID for bank info lookup
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  builders: string[];
  status?: PublishStatus;
  link: string;
  repoLink?: string;
}

export interface AcademyOverview {
  user_id: string;
  name: string;
  role: string;
  member_type: 'member' | 'community';
  academy_access: boolean;
  xp: number;
  completed_lessons: number;
  quiz_passed: number;
  streak?: number;
  last_activity: string | null;
}

export interface AcademyActivity {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  member_type: 'member' | 'community';
  track: string;
  lesson_id: string;
  action:
    | 'started'
    | 'checklist_updated'
    | 'lesson_completed'
    | 'quiz_passed'
    | 'progress_updated'
    | 'lesson_reviewed';
  lesson_completed: boolean;
  quiz_passed: boolean;
  checklist: boolean[];
  xp_snapshot: number;
  recorded_at: string;
}

export interface AcademyQuestionChoice {
  id: string;
  label: string;
}

export interface AcademyQuestion {
  id: string;
  track: string;
  lesson_id: string;
  prompt: string;
  choices: AcademyQuestionChoice[];
  correct_choice_id: string;
  explanation: string;
  sort_order: number;
  status: PublishStatus;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AcademyTrackCatalogLesson {
  id: string;
  title: string;
  minutes: number;
  content_md: string;
  callouts: { title: string; body: string }[];
  sort_order: number;
}

export interface AcademyTrackCatalog {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sort_order: number;
  lessons: AcademyTrackCatalogLesson[];
}

export interface AcademyTrackAdmin {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: PublishStatus;
  sort_order: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AcademyLessonAdmin {
  id: string;
  track: string;
  lesson_id: string;
  title: string;
  minutes: number;
  content_md: string;
  callouts: { title: string; body: string }[];
  status: PublishStatus;
  sort_order: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminApiKey {
  id: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  created_by?: string;
  last_used_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AcademyV2TestCase {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
}

export interface AcademyV2Instructor {
  id: string;
  name: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    github?: string;
  };
}

export interface AcademyV2UnitSummary {
  id: string;
  source_id: string;
  title: string;
  type: 'content' | 'challenge' | 'quiz';
  section: 'learn' | 'practice';
  order: number;
  xp_reward: number;
  language?: 'typescript' | 'rust';
  build_type?: 'standard' | 'buildable';
  deployable?: boolean;
}

export interface AcademyV2UnitDetail extends AcademyV2UnitSummary {
  content_md: string;
  code: string;
  tests: AcademyV2TestCase[];
  hints: string[];
  solution: string;
  video_url: string;
  widgets: string[];
  course_id: string;
  course_title: string;
  module_id: string;
  module_title: string;
}

export interface AcademyV2Module {
  id: string;
  title: string;
  description: string;
  order: number;
  learn_units: AcademyV2UnitSummary[];
  practice_units: AcademyV2UnitSummary[];
}

export interface AcademyV2CourseSummary {
  id: string;
  source_id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  xp_reward: number;
  xp_per_unit: number;
  tags: string[];
  track_level: number;
  thumbnail: string;
  module_count: number;
  learn_unit_count: number;
  practice_unit_count: number;
  total_unit_count: number;
  has_challenge_lab: boolean;
  instructor: AcademyV2Instructor | null;
}

export interface AcademyV2CourseDetail extends AcademyV2CourseSummary {
  path_id: string | null;
  path_title: string | null;
  modules: AcademyV2Module[];
}

export interface AcademyV2Path {
  id: string;
  source_id: string;
  title: string;
  tag: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  course_count: number;
  learn_unit_count: number;
  practice_unit_count: number;
  total_unit_count: number;
  courses: AcademyV2CourseSummary[];
}

export interface AcademyV2CommunityTrack {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sort_order: number;
  lesson_count: number;
  total_minutes: number;
}

export interface AcademyV2AnalyticsLaneSplit {
  curated_rows: number;
  community_rows: number;
  curated_xp: number;
  community_xp: number;
  curated_learners: number;
  community_learners: number;
}

export interface AcademyV2AnalyticsPath {
  id: string;
  title: string;
  completions: number;
  practice_completions: number;
  xp: number;
  learner_count: number;
}

export interface AcademyV2AnalyticsCourse {
  id: string;
  title: string;
  path_id: string | null;
  path_title: string | null;
  completions: number;
  practice_completions: number;
  xp: number;
  learner_count: number;
}

export interface AcademyV2Analytics {
  lane_split: AcademyV2AnalyticsLaneSplit;
  top_paths: AcademyV2AnalyticsPath[];
  top_courses: AcademyV2AnalyticsCourse[];
}
