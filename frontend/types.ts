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
  track: 'genin' | 'chunin' | 'jonin';
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
  track: 'genin' | 'chunin' | 'jonin';
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
