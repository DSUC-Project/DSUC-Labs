import { Member, Event, Bounty, Repo, Resource, Project, Bank } from "../types";

export const AVAILABLE_SKILLS = [
  "React",
  "Next.js",
  "Node.js",
  "Rust",
  "Solana",
  "TypeScript",
];
export const ROLES = [
  "President",
  "Vice-President",
  "Tech-Lead",
  "Media-Lead",
  "Member",
];

export const BANKS: Bank[] = [
  {
    id: "970422",
    name: "MB Bank",
    code: "MB",
    bin: "970422",
    shortName: "MB",
    logo: "",
  },
  {
    id: "970403",
    name: "VCB",
    code: "VCB",
    bin: "970403",
    shortName: "VCB",
    logo: "",
  },
];

export const MEMBERS: Member[] = [
  {
    id: "101240059",
    name: "Zah",
    role: "President",
    avatar: "",
    skills: ["Rust", "Next.js", "Node.js"],
    socials: { github: "https://github.com/lilzahs" },
    bankInfo: { bankId: "970422", accountNo: "06271099999" },
  },
  {
    id: "101240060",
    name: "Thodium",
    role: "Vice-President",
    avatar: "",
    skills: [],
    socials: {},
  },
  {
    id: "102240396",
    name: "Jerry",
    role: "Vice-President",
    avatar: "",
    skills: [],
    socials: {},
  },
];

export const EVENTS: Event[] = [
  {
    id: "e1",
    title: "Hackathon Kickoff",
    date: "2025-12-01",
    time: "18:00",
    type: "Hackathon",
    location: "Auditorium",
    attendees: 120,
  },
  {
    id: "e2",
    title: "Monthly Meetup",
    date: "2025-11-15",
    time: "19:00",
    type: "Social",
    location: "Room 101",
    attendees: 40,
  },
];

export const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "ZAH Wallet",
    description: "On-chain wallet for students",
    category: "Wallet",
    builders: ["101240059", "101240060"],
    link: "",
    repoLink: "",
  },
];

export const BOUNTIES: Bounty[] = [
  {
    id: "b1",
    title: "Implement auth",
    reward: "200",
    difficulty: "Medium",
    tags: ["backend", "auth"],
    status: "Open",
  },
];

export const REPOS: Repo[] = [
  {
    id: "r1",
    name: "dsuc-website",
    description: "Club website",
    language: "TypeScript",
    stars: 10,
    forks: 1,
  },
];

export const RESOURCES: Resource[] = [
  {
    id: "res1",
    name: "Intro to Solana",
    type: "Drive",
    url: "https://drive.google.com/example",
    size: "2MB",
    category: "Learning",
  },
];

export default {};
