export interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  socials: {
    github?: string;
    twitter?: string;
    telegram?: string;
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
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "Workshop" | "Hackathon" | "Social";
  location: string;
  attendees: number;
  luma_link?: string; // Backend snake_case
}

export interface Bounty {
  id: string;
  title: string;
  reward: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  status: "Open" | "In Progress" | "Closed";
  submitLink?: string; // Optional link to submit bounty solution
}

export interface Repo {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
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
  type: "Drive" | "Doc" | "Link";
  url: string;
  size?: string;
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
  link: string;
  repoLink?: string;
}
