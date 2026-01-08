import { Member, Event, Bounty, Repo, Resource, Project, Bank } from "../types";

export const AVAILABLE_SKILLS: string[] = [
  'React',
  'TypeScript',
  'Node.js',
  'Rust',
  'Solana',
  'Smart Contracts',
  'Web3',
  'Python',
  'UI/UX Design',
  'DevOps',
  'Docker',
  'PostgreSQL',
  'MongoDB',
  'GraphQL',
  'Next.js',
  'Blockchain',
  'DeFi',
  'NFT Development',
  'Testing',
  'AWS'
];

export const ROLES: string[] = [
  'President',
  'Vice-President',
  'Tech-Lead',
  'Media-Lead',
  'Member'
];

export const BANKS: Bank[] = [
  { id: '970422', name: 'Techcombank' },
  { id: '970407', name: 'Vietcombank' },
  { id: '970405', name: 'VietinBank' },
  { id: '970415', name: 'Agribank' },
  { id: '970403', name: 'BIDV' },
];

export const MEMBERS: Member[] = [];
export const EVENTS: Event[] = [];
export const PROJECTS: Project[] = [];
export const BOUNTIES: Bounty[] = [];
export const REPOS: Repo[] = [];
export const RESOURCES: Resource[] = [];

export default {};
