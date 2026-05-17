import { v4 as uuidv4 } from "uuid";

export interface Member {
  id: string;
  wallet_address?: string | null;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  socials: Record<string, string>;
  bank_info: Record<string, string>;
  is_active?: boolean;
  member_type?: "member" | "community";
  academy_access?: boolean;
  email?: string | null;
  google_id?: string | null;
  auth_provider?: "wallet" | "google" | "both";
  email_verified?: boolean;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  builders: string[];
  link: string;
  repo_link?: string;
  repoLink?: string;
  tech_stack?: string[];
  image_url?: string;
  status: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AcademyProgress {
  id: string;
  user_id: string;
  track: string;
  lesson_id: string;
  lesson_completed: boolean;
  quiz_passed: boolean;
  checklist: boolean[];
  xp_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface AcademyActivity {
  id: string;
  user_id: string;
  track: string;
  lesson_id: string;
  action:
    | "started"
    | "checklist_updated"
    | "lesson_completed"
    | "quiz_passed"
    | "progress_updated"
    | "lesson_reviewed";
  lesson_completed: boolean;
  quiz_passed: boolean;
  checklist: boolean[];
  xp_snapshot: number;
  recorded_at: string;
}

export interface AcademyQuestion {
  id: string;
  track: string;
  lesson_id: string;
  prompt: string;
  choices: { id: string; label: string }[];
  correct_choice_id: string;
  explanation: string;
  sort_order: number;
  status: "Draft" | "Published" | "Archived";
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademyTrack {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: "Draft" | "Published" | "Archived";
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademyLesson {
  id: string;
  track: string;
  lesson_id: string;
  title: string;
  minutes: number;
  content_md: string;
  callouts: any[];
  status: "Draft" | "Published" | "Archived";
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminApiKey {
  id: string;
  name: string;
  key_hash: string;
  scopes: string[];
  is_active: boolean;
  created_by: string;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

const BASE_TIME = new Date("2026-05-14T09:00:00.000Z");

function isoAt(dayOffset: number, hour = 9, minute = 0) {
  const value = new Date(BASE_TIME);
  value.setUTCDate(value.getUTCDate() + dayOffset);
  value.setUTCHours(hour, minute, 0, 0);
  return value.toISOString();
}

function dateAt(dayOffset: number) {
  return isoAt(dayOffset).slice(0, 10);
}

function avatar(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
    seed,
  )}`;
}

function financeBill(label: string) {
  return `https://via.placeholder.com/960x640?text=${encodeURIComponent(label)}`;
}

function officialMember({
  id,
  wallet_address,
  name,
  role,
  skills,
  socials = {},
  bank_info,
  email = null,
  google_id = null,
  auth_provider,
  profile_completed = true,
  academy_access = true,
}: {
  id: string;
  wallet_address: string;
  name: string;
  role: string;
  skills: string[];
  socials?: Record<string, string>;
  bank_info: Record<string, string>;
  email?: string | null;
  google_id?: string | null;
  auth_provider?: "wallet" | "google" | "both";
  profile_completed?: boolean;
  academy_access?: boolean;
}): Member {
  return {
    id,
    wallet_address,
    name,
    role,
    avatar: avatar(name),
    skills,
    socials,
    bank_info,
    is_active: true,
    member_type: "member",
    academy_access,
    email,
    google_id,
    auth_provider:
      auth_provider || (email || google_id ? "both" : "wallet"),
    email_verified: Boolean(email || google_id),
    profile_completed,
    created_at: isoAt(-120),
    updated_at: isoAt(-2),
  };
}

function communityMember({
  id,
  name,
  skills,
  socials = {},
  email,
  google_id,
  academy_access = true,
  profile_completed = true,
}: {
  id: string;
  name: string;
  skills: string[];
  socials?: Record<string, string>;
  email: string;
  google_id: string;
  academy_access?: boolean;
  profile_completed?: boolean;
}): Member {
  return {
    id,
    wallet_address: null,
    name,
    role: "Community",
    avatar: avatar(name),
    skills,
    socials,
    bank_info: {},
    is_active: true,
    member_type: "community",
    academy_access,
    email,
    google_id,
    auth_provider: "google",
    email_verified: true,
    profile_completed,
    created_at: isoAt(-60),
    updated_at: isoAt(-4),
  };
}

const members: Member[] = [
  officialMember({
    id: "101240059",
    wallet_address: "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm",
    name: "Zah",
    role: "President",
    skills: ["Web3", "Rust", "Design"],
    socials: {
      github: "https://github.com/lilzahs",
      twitter: "https://x.com/doandanh_zah",
      telegram: "https://t.me/doandanh_zah",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "06271099999",
      accountName: "DOAN DO THANH DANH",
    },
    email: "zah@dsuc.fun",
    google_id: "google-zah-local",
  }),
  officialMember({
    id: "102240396",
    wallet_address: "9aieBQHrhou4GqRyNGgieXN8nZxK9uxWKHnvoyNL7NNB",
    name: "Jerry",
    role: "Vice-President",
    skills: ["Marketing", "Operations", "Community"],
    socials: {
      github: "https://github.com/jerry-ici",
      twitter: "https://x.com/jerryiciii",
      telegram: "https://t.me/jerryiciii",
    },
    bank_info: {
      bankId: "970436",
      accountNo: "1028328959",
      accountName: "LE THI THANH THAI",
    },
    email: "jerry@dsuc.fun",
    google_id: "google-jerry-local",
  }),
  officialMember({
    id: "101240060",
    wallet_address: "GEeWZoVZq9JQ9RgWy9zzkhvTAnYBKSvS2gzjXetqutFe",
    name: "Thodium",
    role: "Vice-President",
    skills: ["HR Management", "Event Planning", "Community", "Partnership"],
    socials: {
      github: "https://github.com/Th0dium",
      twitter: "https://x.com/Th0rdium",
      telegram: "https://t.me/Thodium04",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "0347373213",
      accountName: "NGO VAN NHAT DUY",
    },
    email: "thodium@dsuc.fun",
    google_id: "google-thodium-local",
  }),
  officialMember({
    id: "102240386",
    wallet_address: "CYcvdzKjh8B699tbe3UnYM21Vzcp14JQqy5hXs9iUYBT",
    name: "NekoNora",
    role: "Tech-Lead",
    skills: ["Solana", "Rust", "React", "TypeScript", "System Design"],
    socials: {
      github: "https://github.com/thanhnhat23",
      twitter: "https://x.com/ThanhNhat06",
      telegram: "https://t.me/ThanhNhat23",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "0905700494",
      accountName: "LUONG THANH NHAT",
    },
    email: "neko@dsuc.fun",
    google_id: "google-neko-local",
  }),
  officialMember({
    id: "101240071",
    wallet_address: "9YYY8EWz4to5SH7N9K4qAuBNNLLxvVDeJw9TCpvhgDzw",
    name: "Garoz",
    role: "Media-Lead",
    skills: ["Content Creation", "Social Media", "Copywriting"],
    socials: {
      github: "https://github.com/Kunsosad",
      twitter: "https://x.com/darksans10",
      telegram: "https://t.me/Phanconghuy",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "0987520146",
      accountName: "PHAN CONG HUY",
    },
  }),
  officialMember({
    id: "123250164",
    wallet_address: "FjTD1nP1PTR7cUu13tEBPciNe82sCiQ9qRvpkBeKxwxE",
    name: "dainghia17",
    role: "Member",
    skills: ["Editor", "Media"],
    socials: {
      github: "https://github.com/dainghiax17-hub",
      twitter: "https://x.com/dainghiaaa17",
      telegram: "https://t.me/dainghiaaa17",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "0356041438",
      accountName: "HUYNH DAI NGHIA",
    },
  }),
  officialMember({
    id: "123250208",
    wallet_address: "C3mD3SDFjZrRrswBvDTf1p2R8UGhrvpbeqPqBWFg7rMi",
    name: "TruongPhu1003",
    role: "Member",
    skills: ["Python", "AI/ML", "Data Science"],
    socials: {
      github: "https://github.com/truongphu103",
      telegram: "https://t.me/TruongPhu103",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "9100320079",
      accountName: "NGUYEN NGOC TRUONG PHU",
    },
  }),
  officialMember({
    id: "106250128",
    wallet_address: "CDWSdzuLQ8nzKjc1UCNr8MbedAfEHZiqRFvvToWtnNiW",
    name: "dhiern",
    role: "Member",
    skills: ["Solana", "Anchor", "Rust"],
    socials: {
      github: "https://github.com/d-hiern",
      twitter: "https://x.com/D_Hiern",
      telegram: "https://t.me/D_Hiern",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "0812017500",
      accountName: "PHAN DUY HIEN",
    },
  }),
  officialMember({
    id: "102230313",
    wallet_address: "BvCFiu95AfJBtXd4z2LyoLTrMahBKUCZJQcnCXSb6z3o",
    name: "dhtphu05",
    role: "Member",
    skills: ["C++", "Node.js", "Next.js"],
    socials: {
      github: "https://github.com/dhtphu05",
      twitter: "https://x.com/dhtphu05",
      telegram: "https://t.me/dhtphu05",
    },
    bank_info: {
      bankId: "970436",
      accountNo: "1041537741",
      accountName: "DOAN HOANG THIEN PHU",
    },
  }),
  officialMember({
    id: "102240127",
    wallet_address: "DBW3yKvtF5k61PdGYi1VzksGaukUvGT6bN9uwdvD4z5m",
    name: "Kuwongg",
    role: "Member",
    skills: ["C++", "Community Ops"],
    socials: {
      github: "https://github.com/Cuongkudo",
      twitter: "https://x.com/Cuongkudo123",
      telegram: "https://t.me/KuWongg",
    },
    bank_info: {
      bankId: "970415",
      accountNo: "100882221015",
      accountName: "NGUYEN MANH CUONG",
    },
  }),
  officialMember({
    id: "102240286",
    wallet_address: "7JzxzcgN6F1k2r4rPaZEBWmRb5HuCLJX3xVWdoJGGaKi",
    name: "lacachua",
    role: "Member",
    skills: ["Smart Contracts", "Backend", "C++"],
    socials: {
      github: "https://github.com/lacachua",
      twitter: "https://x.com/sh_jessica",
      telegram: "https://t.me/cachuane",
    },
    bank_info: {
      bankId: "970436",
      accountNo: "1024557336",
      accountName: "NGUYEN THI CAM TUYEN",
    },
  }),
  officialMember({
    id: "102230323",
    wallet_address: "GAc9UQCBQpxkL2eGKFa8xBKKMTjDagA7MjHhGT51xxNc",
    name: "Twii",
    role: "Member",
    skills: ["Backend", "PostgreSQL", "Express"],
    socials: {
      github: "https://github.com/ntthuy29",
      twitter: "https://x.com/Thuy292005",
      telegram: "https://t.me/thuy2905",
    },
    bank_info: {
      bankId: "970415",
      accountNo: "0334105228",
      accountName: "NGUYEN THI THUY",
    },
  }),
  officialMember({
    id: "102240170",
    wallet_address: "46x1fCbdiooeqjDMsXsap3JEKFxHMCj1QUVwupeMXSP7",
    name: "mtris",
    role: "Member",
    skills: ["Next.js", "C++", "QA"],
    socials: {
      github: "https://github.com/mtris134",
      twitter: "https://x.com/mtris134",
      telegram: "https://t.me/mtris134",
    },
    bank_info: {
      bankId: "970436",
      accountNo: "9365603556",
      accountName: "LE MINH TRI",
    },
  }),
  officialMember({
    id: "102250190",
    wallet_address: "DZwUcn3ssXZYdxmnMW3JDwDCjKTx66x7ztLDxvv49B6L",
    name: "fuong",
    role: "Member",
    skills: ["Rust", "VibeCode", "C++"],
    socials: {
      github: "https://github.com/PHUOBG",
      twitter: "https://x.com/Phuongloppi",
      telegram: "https://t.me/Loppygirll",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "0326616401",
      accountName: "HOANG THI NGOC PHUONG",
    },
  }),
  officialMember({
    id: "102240261",
    wallet_address: "fHdTXZmGfNmtN5fwErNHzX4RtKyjiWC8sahg7QkQT6K",
    name: "Lilithium",
    role: "Member",
    skills: ["Design", "Next.js", "TypeScript"],
    socials: {
      github: "https://github.com/Liinh-Git",
      twitter: "https://x.com/NguynLinh298772",
      telegram: "https://t.me/Kaslynna",
    },
    bank_info: {
      bankId: "970422",
      accountNo: "0865371670",
      accountName: "NGUYEN DO KHANH LINH",
    },
    email: "linh@dsuc.fun",
    google_id: "google-linh-local",
  }),
  officialMember({
    id: "104260321",
    wallet_address: "9dK8rLmV3WgKoxwDbwV7hQ9z8Cjpt5Nn8Zt2rLJ6X3Qa",
    name: "AnhBuilder",
    role: "Member",
    skills: ["Fullstack", "TypeScript", "Product"],
    socials: {
      github: "https://github.com/anhbuilder",
      telegram: "https://t.me/anhbuilder",
    },
    bank_info: {
      bankId: "970418",
      accountNo: "1904202601",
      accountName: "NGUYEN MINH ANH",
    },
  }),
  communityMember({
    id: "community-001",
    name: "Lan Community",
    skills: ["UI/UX", "Community"],
    socials: {
      github: "https://github.com/community-lan",
      twitter: "https://x.com/community_lan",
    },
    email: "lan.community@example.com",
    google_id: "google-community-001",
  }),
  communityMember({
    id: "community-002",
    name: "Bao Learner",
    skills: ["Frontend", "Solana Basics"],
    socials: {
      telegram: "https://t.me/bao_learner",
    },
    email: "bao.learner@example.com",
    google_id: "google-community-002",
    profile_completed: false,
  }),
  communityMember({
    id: "community-003",
    name: "Minh Research",
    skills: ["Research", "Writing", "Analytics"],
    socials: {
      github: "https://github.com/minh-research",
      twitter: "https://x.com/minh_research",
    },
    email: "minh.research@example.com",
    google_id: "google-community-003",
  }),
  communityMember({
    id: "community-004",
    name: "Hoa Designer",
    skills: ["Brand", "Figma", "Motion"],
    socials: {
      portfolio: "https://hoa.design",
    },
    email: "hoa.designer@example.com",
    google_id: "google-community-004",
  }),
  communityMember({
    id: "community-005",
    name: "Thanh Explorer",
    skills: ["Backend", "Rust", "Security"],
    socials: {
      github: "https://github.com/thanh-explorer",
    },
    email: "thanh.explorer@example.com",
    google_id: "google-community-005",
    academy_access: false,
  }),
];

const projects: Project[] = [
  {
    id: "proj-001",
    name: "DSUC Portal",
    description:
      "Unified portal for members, academy learners, work boards, and operations.",
    category: "Blockchain",
    builders: ["Thodium", "NekoNora", "Lilithium"],
    link: "https://portal.dsuc.local/demo",
    repo_link: "https://github.com/dsuc-labs/portal",
    repoLink: "https://github.com/dsuc-labs/portal",
    tech_stack: ["React", "TypeScript", "Express", "Supabase"],
    image_url: financeBill("DSUC Portal"),
    status: "Published",
    created_by: "102240386",
    created_at: isoAt(-45),
    updated_at: isoAt(-3),
  },
  {
    id: "proj-002",
    name: "Discord Bot",
    description:
      "Community automation bot for onboarding, role sync, event reminders, and project alerts.",
    category: "Tooling",
    builders: ["NekoNora"],
    link: "https://discord.gg/dsuc",
    repo_link: "https://github.com/dsuc-labs/discord-bot",
    repoLink: "https://github.com/dsuc-labs/discord-bot",
    tech_stack: ["TypeScript", "Discord.js", "PostgreSQL"],
    status: "Published",
    created_by: "102240386",
    created_at: isoAt(-40),
    updated_at: isoAt(-6),
  },
  {
    id: "proj-003",
    name: "Grant Radar",
    description:
      "Aggregator for ecosystem grants, bounties, and submission timelines with team-ready filters.",
    category: "Education",
    builders: ["Zah", "AnhBuilder"],
    link: "https://grants.dsuc.local",
    repo_link: "https://github.com/dsuc-labs/grant-radar",
    repoLink: "https://github.com/dsuc-labs/grant-radar",
    tech_stack: ["Next.js", "Node.js", "Tailwind"],
    status: "Published",
    created_by: "101240059",
    created_at: isoAt(-32),
    updated_at: isoAt(-4),
  },
  {
    id: "proj-004",
    name: "Blinks Studio",
    description:
      "Rapid prototyping sandbox for Solana Actions/Blinks with preset templates for campaigns.",
    category: "Marketing",
    builders: ["Garoz", "fuong"],
    link: "https://blinks.dsuc.local",
    repo_link: "https://github.com/dsuc-labs/blinks-studio",
    repoLink: "https://github.com/dsuc-labs/blinks-studio",
    tech_stack: ["Vite", "TypeScript", "Solana Actions"],
    status: "Published",
    created_by: "101240071",
    created_at: isoAt(-24),
    updated_at: isoAt(-2),
  },
  {
    id: "proj-005",
    name: "Campus Treasury",
    description:
      "Internal finance dashboard for tracking reimbursements, ledgers, and transfer queues.",
    category: "Operations",
    builders: ["Jerry", "Twii"],
    link: "https://finance.dsuc.local",
    repo_link: "https://github.com/dsuc-labs/campus-treasury",
    repoLink: "https://github.com/dsuc-labs/campus-treasury",
    tech_stack: ["React", "Express", "Zustand"],
    status: "Published",
    created_by: "102240396",
    created_at: isoAt(-18),
    updated_at: isoAt(-1),
  },
  {
    id: "proj-006",
    name: "Validator Quest",
    description:
      "Learning mini-game for validator economics and staking strategy, designed for workshops.",
    category: "Gaming",
    builders: ["TruongPhu1003", "Lan Community"],
    link: "https://quest.dsuc.local",
    repo_link: "https://github.com/dsuc-labs/validator-quest",
    repoLink: "https://github.com/dsuc-labs/validator-quest",
    tech_stack: ["React", "Canvas", "TypeScript"],
    status: "Published",
    created_by: "123250208",
    created_at: isoAt(-12),
    updated_at: isoAt(-1),
  },
  {
    id: "proj-007",
    name: "Ops Control Panel",
    description:
      "Internal admin panel for publishing entities and monitoring community operations.",
    category: "Operations",
    builders: ["Zah", "NekoNora"],
    link: "https://ops.dsuc.local",
    repo_link: "https://github.com/dsuc-labs/ops-control-panel",
    repoLink: "https://github.com/dsuc-labs/ops-control-panel",
    tech_stack: ["React", "Node.js", "PostgreSQL"],
    status: "Draft",
    created_by: "101240059",
    created_at: isoAt(-5),
    updated_at: isoAt(-1),
  },
];

const financeRequests = [
  {
    id: "fin-req-001",
    requester_id: "101240060",
    requester_name: "Thodium",
    amount: 500000,
    reason: "DSUC Event Catering",
    date: dateAt(-8),
    bill_image: financeBill("Event Catering"),
    status: "pending",
    created_at: isoAt(-8, 10, 30),
  },
  {
    id: "fin-req-002",
    requester_id: "102240386",
    requester_name: "NekoNora",
    amount: 300000,
    reason: "Server hosting Q2 2026",
    date: dateAt(-16),
    bill_image: financeBill("Server Hosting"),
    status: "completed",
    processed_by: "101240060",
    processed_at: isoAt(-15, 9, 0),
    created_at: isoAt(-16, 8, 0),
  },
  {
    id: "fin-req-003",
    requester_id: "101240071",
    requester_name: "Garoz",
    amount: 180000,
    reason: "Workshop poster printing",
    date: dateAt(-12),
    bill_image: financeBill("Poster Printing"),
    status: "rejected",
    processed_by: "102240396",
    processed_at: isoAt(-11, 15, 20),
    created_at: isoAt(-12, 11, 10),
  },
  {
    id: "fin-req-004",
    requester_id: "123250208",
    requester_name: "TruongPhu1003",
    amount: 220000,
    reason: "RPC credits for workshop demo",
    date: dateAt(-4),
    bill_image: financeBill("RPC Credits"),
    status: "pending",
    created_at: isoAt(-4, 14, 10),
  },
  {
    id: "fin-req-005",
    requester_id: "102240261",
    requester_name: "Lilithium",
    amount: 350000,
    reason: "Brand guideline print set",
    date: dateAt(-20),
    bill_image: financeBill("Brand Guideline"),
    status: "completed",
    processed_by: "101240059",
    processed_at: isoAt(-19, 10, 0),
    created_at: isoAt(-20, 8, 45),
  },
];

const financeHistory = [
  {
    id: "fin-hist-001",
    requester_id: "102240386",
    requester_name: "NekoNora",
    amount: 300000,
    reason: "Server hosting Q2 2026",
    date: dateAt(-16),
    bill_image: financeBill("Server Hosting"),
    status: "completed",
    processed_by: "101240060",
    processed_by_name: "Thodium",
    processed_at: isoAt(-15, 9, 0),
    created_at: isoAt(-16, 8, 0),
  },
  {
    id: "fin-hist-002",
    requester_id: "101240071",
    requester_name: "Garoz",
    amount: 180000,
    reason: "Workshop poster printing",
    date: dateAt(-12),
    bill_image: financeBill("Poster Printing"),
    status: "rejected",
    processed_by: "102240396",
    processed_by_name: "Jerry",
    processed_at: isoAt(-11, 15, 20),
    created_at: isoAt(-12, 11, 10),
  },
  {
    id: "fin-hist-003",
    requester_id: "102240261",
    requester_name: "Lilithium",
    amount: 350000,
    reason: "Brand guideline print set",
    date: dateAt(-20),
    bill_image: financeBill("Brand Guideline"),
    status: "completed",
    processed_by: "101240059",
    processed_by_name: "Zah",
    processed_at: isoAt(-19, 10, 0),
    created_at: isoAt(-20, 8, 45),
  },
  {
    id: "fin-hist-004",
    requester_id: "123250164",
    requester_name: "dainghia17",
    amount: 120000,
    reason: "Captioning software monthly fee",
    date: dateAt(-28),
    bill_image: financeBill("Captioning Software"),
    status: "completed",
    processed_by: "101240060",
    processed_by_name: "Thodium",
    processed_at: isoAt(-27, 13, 0),
    created_at: isoAt(-28, 9, 30),
  },
];

const events = [
  {
    id: "evt-001",
    title: "Solana Development Workshop",
    date: dateAt(12),
    time: "14:00",
    type: "Workshop",
    location: "HCMC Tech Hub, District 1",
    attendees: 25,
    status: "Published",
    created_by: "102240386",
    luma_link: "https://lu.ma/dsuc-solana-workshop",
    description: "Hands-on session covering wallet flows and first on-chain reads.",
    created_at: isoAt(-14, 9, 0),
  },
  {
    id: "evt-002",
    title: "Web3 Hackathon 2026",
    date: dateAt(30),
    time: "08:00",
    type: "Hackathon",
    location: "Online",
    attendees: 42,
    status: "Published",
    created_by: "101240060",
    luma_link: "https://lu.ma/dsuc-hackathon-2026",
    description: "48-hour build sprint with mentor hours and final demo review.",
    created_at: isoAt(-12, 11, 0),
  },
  {
    id: "evt-003",
    title: "Community Demo Night",
    date: dateAt(7),
    time: "19:00",
    type: "Social",
    location: "DSUC Discord Stage",
    attendees: 64,
    status: "Published",
    created_by: "101240071",
    luma_link: "https://lu.ma/dsuc-demo-night",
    description: "Weekly showcase for member builds and academy capstones.",
    created_at: isoAt(-6, 16, 15),
  },
  {
    id: "evt-004",
    title: "Validator Economics Deep Dive",
    date: dateAt(18),
    time: "16:30",
    type: "Workshop",
    location: "Co-working Room 5",
    attendees: 18,
    status: "Published",
    created_by: "123250208",
    luma_link: "https://lu.ma/validator-econ",
    description: "Reading validator metrics and understanding stake incentives.",
    created_at: isoAt(-9, 10, 0),
  },
  {
    id: "evt-005",
    title: "Semester Onboarding Sprint",
    date: dateAt(-10),
    time: "13:00",
    type: "Workshop",
    location: "Campus Lab 3",
    attendees: 58,
    status: "Published",
    created_by: "102240396",
    luma_link: "https://lu.ma/dsuc-onboarding",
    description: "Completed onboarding event for the newest DSUC intake.",
    created_at: isoAt(-22, 9, 20),
  },
  {
    id: "evt-006",
    title: "Treasury Review Roundtable",
    date: dateAt(21),
    time: "15:00",
    type: "Social",
    location: "Ops Room",
    attendees: 12,
    status: "Draft",
    created_by: "101240059",
    luma_link: "",
    description: "Internal review of finance workflows before publication.",
    created_at: isoAt(-3, 15, 0),
  },
];

const bounties = [
  {
    id: "bounty-001",
    title: "Fix Discord Bot /help Command",
    description: "Implement missing autocomplete feature for /help command.",
    reward: 50000,
    difficulty: "Easy",
    tags: ["Discord.js", "TypeScript", "Bot"],
    status: "Open",
    submit_link: "https://github.com/dsuc-labs/discord-bot/issues/12",
    created_by: "102240386",
    created_at: isoAt(-13, 11, 0),
  },
  {
    id: "bounty-002",
    title: "Add Dark Mode to Portal",
    description: "Implement theme switching and improve contrast on key views.",
    reward: 100000,
    difficulty: "Medium",
    tags: ["React", "CSS", "UI/UX"],
    status: "In Progress",
    submit_link: "https://github.com/dsuc-labs/portal/issues/5",
    created_by: "101240060",
    created_at: isoAt(-10, 9, 30),
  },
  {
    id: "bounty-003",
    title: "Treasury Ledger Export",
    description: "Export finance history to CSV with normalized metadata.",
    reward: 120000,
    difficulty: "Medium",
    tags: ["Node.js", "CSV", "Finance"],
    status: "Open",
    submit_link: "https://github.com/dsuc-labs/campus-treasury/issues/7",
    created_by: "102240396",
    created_at: isoAt(-8, 13, 0),
  },
  {
    id: "bounty-004",
    title: "Indexer Alert Bot",
    description: "Notify the team when monitored wallets cross configured thresholds.",
    reward: 180000,
    difficulty: "Hard",
    tags: ["Solana", "Indexing", "DevOps"],
    status: "Completed",
    submit_link: "https://github.com/dsuc-labs/indexer-alerts/issues/2",
    created_by: "101240059",
    created_at: isoAt(-21, 10, 10),
  },
  {
    id: "bounty-005",
    title: "Resource Card Motion Pass",
    description: "Polish hover and loading behavior on the resource grid.",
    reward: 70000,
    difficulty: "Easy",
    tags: ["Motion", "Frontend", "Tailwind"],
    status: "Closed",
    submit_link: "https://github.com/dsuc-labs/portal/issues/31",
    created_by: "101240071",
    created_at: isoAt(-5, 16, 10),
  },
];

const repos = [
  {
    id: "repo-001",
    name: "DSUC Portal",
    description: "Main portal for members, academy, and operations.",
    language: "TypeScript/React",
    status: "Published",
    url: "https://github.com/dsuc-labs/portal",
    stars: 42,
    forks: 12,
    created_by: "102240386",
    created_at: isoAt(-35, 8, 0),
  },
  {
    id: "repo-002",
    name: "Discord Bot",
    description: "Community management bot with event and role automation.",
    language: "TypeScript/Discord.js",
    status: "Published",
    url: "https://github.com/dsuc-labs/discord-bot",
    stars: 18,
    forks: 5,
    created_by: "101240060",
    created_at: isoAt(-32, 10, 0),
  },
  {
    id: "repo-003",
    name: "Grant Radar",
    description: "Grant discovery and submission workflow tools.",
    language: "Next.js",
    status: "Published",
    url: "https://github.com/dsuc-labs/grant-radar",
    stars: 25,
    forks: 7,
    created_by: "101240059",
    created_at: isoAt(-20, 14, 0),
  },
  {
    id: "repo-004",
    name: "Validator Quest",
    description: "Game-like learning environment for validator concepts.",
    language: "TypeScript",
    status: "Published",
    url: "https://github.com/dsuc-labs/validator-quest",
    stars: 11,
    forks: 2,
    created_by: "123250208",
    created_at: isoAt(-14, 9, 0),
  },
  {
    id: "repo-005",
    name: "Ops Control Panel",
    description: "Internal control plane for publishing and moderation.",
    language: "TypeScript/Node.js",
    status: "Draft",
    url: "https://github.com/dsuc-labs/ops-control-panel",
    stars: 5,
    forks: 1,
    created_by: "101240059",
    created_at: isoAt(-4, 11, 40),
  },
];

const resources = [
  {
    id: "res-001",
    name: "Solana Development Guide",
    type: "Document",
    url: "https://docs.solana.com",
    size: "Docs",
    status: "Published",
    category: "Learning",
    description: "Canonical Solana documentation hub for accounts, programs, and tooling.",
    tags: ["solana", "docs", "core"],
    created_by: "102240386",
    created_at: isoAt(-30, 10, 0),
  },
  {
    id: "res-002",
    name: "Anchor Crash Course Recording",
    type: "Video",
    url: "https://www.youtube.com/watch?v=anchor-crash-course",
    size: "57 min",
    status: "Published",
    category: "Training",
    description: "Recorded walkthrough of Anchor setup, PDA patterns, and testing flow.",
    tags: ["anchor", "video", "training"],
    created_by: "106250128",
    created_at: isoAt(-27, 14, 0),
  },
  {
    id: "res-003",
    name: "DSUC Brand Kit",
    type: "Drive",
    url: "https://drive.google.com/brand-kit",
    size: "1.2 GB",
    status: "Published",
    category: "Media",
    description: "Logo files, posters, social templates, and motion assets for campaigns.",
    tags: ["brand", "media", "assets"],
    created_by: "101240071",
    created_at: isoAt(-22, 11, 10),
  },
  {
    id: "res-004",
    name: "Hackathon Submission Checklist",
    type: "Doc",
    url: "https://docs.google.com/document/d/hackathon-checklist",
    size: "14 pages",
    status: "Published",
    category: "Hackathon",
    description: "Checklist for demo, repository hygiene, slides, and judging criteria.",
    tags: ["hackathon", "checklist", "ops"],
    created_by: "101240060",
    created_at: isoAt(-18, 9, 0),
  },
  {
    id: "res-005",
    name: "RPC Providers Comparison Sheet",
    type: "Link",
    url: "https://notion.so/rpc-comparison",
    size: "Sheet",
    status: "Published",
    category: "Document",
    description: "Latency, limits, and pricing notes for the providers commonly used by DSUC.",
    tags: ["rpc", "infra", "pricing"],
    created_by: "123250208",
    created_at: isoAt(-16, 16, 45),
  },
  {
    id: "res-006",
    name: "Wallet Adapter Starter Template",
    type: "Drive",
    url: "https://drive.google.com/wallet-adapter-starter",
    size: "240 MB",
    status: "Published",
    category: "Learning",
    description: "Starter repo bundle for wallet connection, message signing, and transaction UX.",
    tags: ["wallet", "starter", "frontend"],
    created_by: "102240386",
    created_at: isoAt(-10, 13, 20),
  },
  {
    id: "res-007",
    name: "Grant Writing Framework",
    type: "Document",
    url: "https://docs.google.com/document/d/grant-writing-framework",
    size: "8 pages",
    status: "Archived",
    category: "Document",
    description: "Archived draft framework for older grant cycles.",
    tags: ["grant", "archive"],
    created_by: "101240059",
    created_at: isoAt(-40, 8, 30),
  },
  {
    id: "res-008",
    name: "Core Team Onboarding Deck",
    type: "Video",
    url: "https://www.loom.com/share/core-onboarding",
    size: "22 min",
    status: "Published",
    category: "Training",
    description: "Internal walkthrough of publishing flow, moderation, and ownership areas.",
    tags: ["onboarding", "ops", "video"],
    created_by: "102240396",
    created_at: isoAt(-6, 10, 5),
  },
];

const academyTracks: AcademyTrack[] = [
  {
    id: "wallet-integration",
    title: "Wallet Integration",
    subtitle: "Connect, sign, and persist wallet-aware UI flows.",
    description:
      "A practical track for connecting wallets, reading identity, and building reliable frontend auth UX.",
    status: "Published",
    sort_order: 1,
    created_by: "102240386",
    created_at: isoAt(-50, 9, 0),
    updated_at: isoAt(-3, 9, 0),
  },
  {
    id: "onchain-reading",
    title: "Reading On-Chain Data",
    subtitle: "RPC methods, account data, and indexing basics.",
    description:
      "Learn how to query Solana state, inspect account layouts, and build read-heavy product features.",
    status: "Published",
    sort_order: 2,
    created_by: "123250208",
    created_at: isoAt(-48, 10, 0),
    updated_at: isoAt(-2, 10, 0),
  },
  {
    id: "protocol-security",
    title: "Protocol Security Review",
    subtitle: "Threat models and exploit patterns for Solana teams.",
    description:
      "Draft security-focused curriculum for admin review before community release.",
    status: "Draft",
    sort_order: 3,
    created_by: "101240059",
    created_at: isoAt(-12, 14, 0),
    updated_at: isoAt(-1, 14, 0),
  },
];

const academyLessons: AcademyLesson[] = [
  {
    id: "lesson-wallet-001",
    track: "wallet-integration",
    lesson_id: "connect-wallet",
    title: "Connect Wallet UX",
    minutes: 12,
    content_md:
      "# Connect Wallet UX\n\nBuild a wallet connect flow that communicates state clearly and fails gracefully.",
    callouts: [{ type: "tip", text: "Always show a clear disconnected state." }],
    status: "Published",
    sort_order: 1,
    created_by: "102240386",
    created_at: isoAt(-45, 9, 0),
    updated_at: isoAt(-3, 9, 0),
  },
  {
    id: "lesson-wallet-002",
    track: "wallet-integration",
    lesson_id: "siws-basics",
    title: "Message Signing and SIWS",
    minutes: 15,
    content_md:
      "# SIWS Basics\n\nUnderstand signed messages, intent binding, and what the backend must verify.",
    callouts: [{ type: "warning", text: "Do not treat bare wallet headers as strong auth in production." }],
    status: "Published",
    sort_order: 2,
    created_by: "102240386",
    created_at: isoAt(-44, 9, 0),
    updated_at: isoAt(-3, 9, 0),
  },
  {
    id: "lesson-wallet-003",
    track: "wallet-integration",
    lesson_id: "session-persistence",
    title: "Persisting Wallet Sessions",
    minutes: 10,
    content_md:
      "# Session Persistence\n\nUse stable identifiers and replay-safe session restore patterns for wallet users.",
    callouts: [{ type: "tip", text: "Separate transport auth from UI state." }],
    status: "Published",
    sort_order: 3,
    created_by: "102240386",
    created_at: isoAt(-43, 9, 0),
    updated_at: isoAt(-3, 9, 0),
  },
  {
    id: "lesson-chain-001",
    track: "onchain-reading",
    lesson_id: "rpc-methods",
    title: "RPC Query Patterns",
    minutes: 14,
    content_md:
      "# RPC Query Patterns\n\nChoose the right RPC calls for balances, accounts, signatures, and program data.",
    callouts: [{ type: "tip", text: "Start from the cheapest endpoint that answers the question." }],
    status: "Published",
    sort_order: 1,
    created_by: "123250208",
    created_at: isoAt(-42, 10, 0),
    updated_at: isoAt(-2, 10, 0),
  },
  {
    id: "lesson-chain-002",
    track: "onchain-reading",
    lesson_id: "account-layouts",
    title: "Account Layouts and Parsing",
    minutes: 16,
    content_md:
      "# Account Layouts\n\nMap raw bytes to meaningful UI and analytics fields without guessing.",
    callouts: [{ type: "warning", text: "Document every byte offset you depend on." }],
    status: "Published",
    sort_order: 2,
    created_by: "123250208",
    created_at: isoAt(-41, 10, 0),
    updated_at: isoAt(-2, 10, 0),
  },
  {
    id: "lesson-chain-003",
    track: "onchain-reading",
    lesson_id: "indexing-basics",
    title: "Indexing and Caching",
    minutes: 18,
    content_md:
      "# Indexing Basics\n\nBuild read models that keep product pages fast while handling eventual consistency.",
    callouts: [{ type: "tip", text: "Separate canonical source from presentation cache." }],
    status: "Published",
    sort_order: 3,
    created_by: "123250208",
    created_at: isoAt(-40, 10, 0),
    updated_at: isoAt(-2, 10, 0),
  },
  {
    id: "lesson-sec-001",
    track: "protocol-security",
    lesson_id: "authority-checks",
    title: "Authority Boundaries",
    minutes: 20,
    content_md:
      "# Authority Boundaries\n\nDraft note set for signer assumptions, PDAs, and role checks.",
    callouts: [],
    status: "Draft",
    sort_order: 1,
    created_by: "101240059",
    created_at: isoAt(-10, 14, 0),
    updated_at: isoAt(-1, 14, 0),
  },
];

const academyQuestions: AcademyQuestion[] = [
  {
    id: "q-wallet-001",
    track: "wallet-integration",
    lesson_id: "connect-wallet",
    prompt: "Why should the UI always expose a disconnected state clearly?",
    choices: [
      { id: "a", label: "So users can tell when actions require reconnecting" },
      { id: "b", label: "To reduce CSS bundle size" },
      { id: "c", label: "Because wallet adapters require dark mode" },
    ],
    correct_choice_id: "a",
    explanation: "A visible disconnected state prevents broken assumptions about signing readiness.",
    sort_order: 1,
    status: "Published",
    created_by: "102240386",
    created_at: isoAt(-38, 11, 0),
    updated_at: isoAt(-2, 11, 0),
  },
  {
    id: "q-wallet-002",
    track: "wallet-integration",
    lesson_id: "siws-basics",
    prompt: "What does a backend need in addition to a wallet address for stronger auth?",
    choices: [
      { id: "a", label: "A signed message bound to intent" },
      { id: "b", label: "The user's browser version" },
      { id: "c", label: "The user's Discord handle" },
    ],
    correct_choice_id: "a",
    explanation: "A wallet address alone does not prove current user control in production.",
    sort_order: 1,
    status: "Published",
    created_by: "102240386",
    created_at: isoAt(-38, 11, 30),
    updated_at: isoAt(-2, 11, 30),
  },
  {
    id: "q-chain-001",
    track: "onchain-reading",
    lesson_id: "rpc-methods",
    prompt: "What is the practical first step when selecting an RPC method?",
    choices: [
      { id: "a", label: "Pick the cheapest call that answers the product question" },
      { id: "b", label: "Always start with getProgramAccounts" },
      { id: "c", label: "Read from cached UI state only" },
    ],
    correct_choice_id: "a",
    explanation: "Efficient read paths reduce latency and provider cost.",
    sort_order: 1,
    status: "Published",
    created_by: "123250208",
    created_at: isoAt(-37, 10, 0),
    updated_at: isoAt(-2, 10, 0),
  },
  {
    id: "q-chain-002",
    track: "onchain-reading",
    lesson_id: "account-layouts",
    prompt: "Why document byte offsets when parsing account data?",
    choices: [
      { id: "a", label: "To keep decoding reproducible and reviewable" },
      { id: "b", label: "To avoid using TypeScript" },
      { id: "c", label: "To make RPC nodes faster" },
    ],
    correct_choice_id: "a",
    explanation: "Parsed account layouts must stay auditable when data evolves.",
    sort_order: 1,
    status: "Published",
    created_by: "123250208",
    created_at: isoAt(-37, 10, 30),
    updated_at: isoAt(-2, 10, 30),
  },
];

const academyProgress: AcademyProgress[] = [
  {
    id: "prog-001",
    user_id: "101240059",
    track: "wallet-integration",
    lesson_id: "connect-wallet",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_awarded: 100,
    created_at: isoAt(-5, 9, 0),
    updated_at: isoAt(-5, 9, 30),
  },
  {
    id: "prog-002",
    user_id: "101240059",
    track: "wallet-integration",
    lesson_id: "siws-basics",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_awarded: 130,
    created_at: isoAt(-4, 10, 0),
    updated_at: isoAt(-4, 10, 20),
  },
  {
    id: "prog-003",
    user_id: "102240386",
    track: "onchain-reading",
    lesson_id: "rpc-methods",
    lesson_completed: true,
    quiz_passed: false,
    checklist: [true, true, false],
    xp_awarded: 80,
    created_at: isoAt(-6, 13, 0),
    updated_at: isoAt(-6, 13, 25),
  },
  {
    id: "prog-004",
    user_id: "123250208",
    track: "onchain-reading",
    lesson_id: "account-layouts",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_awarded: 120,
    created_at: isoAt(-3, 14, 0),
    updated_at: isoAt(-3, 14, 25),
  },
  {
    id: "prog-005",
    user_id: "community-001",
    track: "wallet-integration",
    lesson_id: "session-persistence",
    lesson_completed: false,
    quiz_passed: false,
    checklist: [true, false, false],
    xp_awarded: 30,
    created_at: isoAt(-2, 9, 15),
    updated_at: isoAt(-2, 9, 30),
  },
  {
    id: "prog-006",
    user_id: "community-003",
    track: "solana-foundations",
    lesson_id: "wallet-setup",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_awarded: 95,
    created_at: isoAt(-1, 11, 0),
    updated_at: isoAt(-1, 11, 15),
  },
];

const academyActivity: AcademyActivity[] = [
  {
    id: "act-001",
    user_id: "101240059",
    track: "wallet-integration",
    lesson_id: "connect-wallet",
    action: "lesson_completed",
    lesson_completed: true,
    quiz_passed: false,
    checklist: [true, true, true],
    xp_snapshot: 100,
    recorded_at: isoAt(-5, 9, 30),
  },
  {
    id: "act-002",
    user_id: "101240059",
    track: "wallet-integration",
    lesson_id: "siws-basics",
    action: "quiz_passed",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_snapshot: 130,
    recorded_at: isoAt(-4, 10, 20),
  },
  {
    id: "act-003",
    user_id: "101240059",
    track: "wallet-integration",
    lesson_id: "siws-basics",
    action: "lesson_reviewed",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_snapshot: 130,
    recorded_at: isoAt(-1, 8, 50),
  },
  {
    id: "act-004",
    user_id: "102240386",
    track: "onchain-reading",
    lesson_id: "rpc-methods",
    action: "checklist_updated",
    lesson_completed: false,
    quiz_passed: false,
    checklist: [true, true, false],
    xp_snapshot: 40,
    recorded_at: isoAt(-6, 13, 10),
  },
  {
    id: "act-005",
    user_id: "102240386",
    track: "onchain-reading",
    lesson_id: "rpc-methods",
    action: "progress_updated",
    lesson_completed: true,
    quiz_passed: false,
    checklist: [true, true, false],
    xp_snapshot: 80,
    recorded_at: isoAt(-6, 13, 25),
  },
  {
    id: "act-006",
    user_id: "123250208",
    track: "onchain-reading",
    lesson_id: "account-layouts",
    action: "quiz_passed",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_snapshot: 120,
    recorded_at: isoAt(-3, 14, 25),
  },
  {
    id: "act-007",
    user_id: "community-001",
    track: "wallet-integration",
    lesson_id: "session-persistence",
    action: "started",
    lesson_completed: false,
    quiz_passed: false,
    checklist: [true, false, false],
    xp_snapshot: 30,
    recorded_at: isoAt(-2, 9, 30),
  },
  {
    id: "act-008",
    user_id: "community-003",
    track: "solana-foundations",
    lesson_id: "wallet-setup",
    action: "quiz_passed",
    lesson_completed: true,
    quiz_passed: true,
    checklist: [true, true, true],
    xp_snapshot: 95,
    recorded_at: isoAt(-1, 11, 15),
  },
];

const adminApiKeys: AdminApiKey[] = [
  {
    id: "adm-key-001",
    name: "Local Agent Admin",
    key_hash:
      "d9f6d2f9ac2e6f9d4e4d42d25e8ae2f85e6b4010cfb55b0adce5db34b282f001",
    scopes: ["admin:read", "admin:write", "academy:write"],
    is_active: true,
    created_by: "101240059",
    last_used_at: isoAt(-1, 8, 0),
    created_at: isoAt(-20, 9, 0),
    updated_at: isoAt(-1, 8, 0),
  },
  {
    id: "adm-key-002",
    name: "Readonly QA",
    key_hash:
      "0bd5a0be4f6e1a377f4e92c9e61ddfc7a3e494af2ecfd46fb72e8b0df18a0002",
    scopes: ["admin:read"],
    is_active: false,
    created_by: "102240396",
    last_used_at: null,
    created_at: isoAt(-15, 9, 30),
    updated_at: isoAt(-5, 10, 30),
  },
];

export const MOCK_DB = {
  members,
  projects,
  finance_requests: financeRequests,
  finance_history: financeHistory,
  events,
  bounties,
  repos,
  resources,
  academy_progress: academyProgress,
  academy_activity: academyActivity,
  academy_questions: academyQuestions,
  academy_tracks: academyTracks,
  academy_lessons: academyLessons,
  admin_api_keys: adminApiKeys,
};

type MockTableName = keyof typeof MOCK_DB;

function cloneRows<T>(rows: T[]) {
  return rows.map((row) => ({ ...row }));
}

function createSelectionBuilder(rows: any[]) {
  const data = cloneRows(rows);

  const builder: any = {
    data,
    error: null,
    select: () => builder,
    eq: (column: string, value: any) =>
      createSelectionBuilder(data.filter((item: any) => item[column] === value)),
    neq: (column: string, value: any) =>
      createSelectionBuilder(data.filter((item: any) => item[column] !== value)),
    in: (column: string, values: any[]) =>
      createSelectionBuilder(
        data.filter((item: any) => values.includes(item[column])),
      ),
    not: (column: string, operator: string, value: any) =>
      createSelectionBuilder(
        data.filter((item: any) => {
          if (operator === "is") {
            return item[column] !== value;
          }
          return true;
        }),
      ),
    or: (expression: string) => {
      const clauses = expression
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const [column, operator, ...rest] = part.split(".");
          return { column, operator, value: rest.join(".") };
        });

      return createSelectionBuilder(
        data.filter((item: any) =>
          clauses.some((clause) => {
            if (clause.operator === "eq") {
              return String(item[clause.column] || "") === clause.value;
            }
            return false;
          }),
        ),
      );
    },
    gte: (column: string, value: any) =>
      createSelectionBuilder(data.filter((item: any) => item[column] >= value)),
    limit: (count: number) => createSelectionBuilder(data.slice(0, count)),
    order: (column: string, options: { ascending: boolean }) =>
      createSelectionBuilder(
        [...data].sort((left: any, right: any) => {
          const leftValue = left[column];
          const rightValue = right[column];
          const comparison =
            leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
          return options.ascending ? comparison : -comparison;
        }),
      ),
    single: () => ({
      data: data[0] || null,
      error:
        data.length === 0
          ? { message: "Not found", code: "404", details: "", hint: "" }
          : null,
    }),
  };

  return builder;
}

function createMutationBuilder(
  table: MockTableName,
  mode: "update" | "delete",
  payload?: Record<string, any>,
) {
  const filters: Array<(item: any) => boolean> = [];
  let executed = false;
  let resultRows: any[] = [];

  const execute = () => {
    if (executed) {
      return;
    }

    executed = true;
    const items = MOCK_DB[table] as any[];
    const matchingRows = items.filter((item) =>
      filters.every((predicate) => predicate(item)),
    );

    if (mode === "update") {
      for (const item of matchingRows) {
        Object.assign(item, payload, { updated_at: new Date().toISOString() });
      }
      resultRows = cloneRows(matchingRows);
      return;
    }

    const idsToDelete = new Set(matchingRows.map((item) => item.id));
    resultRows = cloneRows(matchingRows);
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (idsToDelete.has(items[index]?.id)) {
        items.splice(index, 1);
      }
    }
  };

  const builder: any = {
    eq: (column: string, value: any) => {
      filters.push((item: any) => item[column] === value);
      return builder;
    },
    neq: (column: string, value: any) => {
      filters.push((item: any) => item[column] !== value);
      return builder;
    },
    select: () => {
      execute();
      return createSelectionBuilder(resultRows);
    },
    single: () => {
      execute();
      return {
        data: resultRows[0] || null,
        error:
          resultRows.length === 0
            ? { message: "Not found", code: "404", details: "", hint: "" }
            : null,
      };
    },
    then: (resolve: any, reject: any) => {
      try {
        execute();
        const response =
          mode === "delete"
            ? {
                data: resultRows[0] ? { id: resultRows[0].id } : null,
                error: null,
              }
            : {
                data:
                  resultRows.length <= 1 ? resultRows[0] || null : resultRows,
                error: null,
              };
        return Promise.resolve(response).then(resolve, reject);
      } catch (error) {
        return Promise.reject(error).then(resolve, reject);
      }
    },
  };

  return builder;
}

export const mockDb = {
  from: (table: MockTableName) => ({
    select: (_columns = "*") => createSelectionBuilder(MOCK_DB[table] as any[]),

    insert: (records: any[] | Record<string, any>) => {
      const inputRows = Array.isArray(records) ? records : [records];
      const newRows = inputRows.map((record) => ({
        ...record,
        id: record.id || uuidv4(),
        created_at: record.created_at || new Date().toISOString(),
      }));

      (MOCK_DB[table] as any[]).push(...newRows);

      return {
        data: newRows,
        error: null,
        select: () => createSelectionBuilder(newRows),
      };
    },

    update: (updates: Record<string, any>) =>
      createMutationBuilder(table, "update", updates),

    delete: () => createMutationBuilder(table, "delete"),
  }),
};
