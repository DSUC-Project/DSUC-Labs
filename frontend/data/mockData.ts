import { Member, Event, Bounty, Repo, Resource, Project, Bank } from "../types";

// Re-export skills from the comprehensive library
export { AVAILABLE_SKILLS } from './skillsLibrary';

export const ROLES: string[] = [
    // Executive & Leadership
    'President',
    'Vice-President',
    'Director',
    'Co-Founder',
    'CTO',
    'CPO',
    'COO',
    'CFO',
    'Board Member',

    // Technical (expanded)
    'Tech-Lead',
    'Engineering Lead',
    'Backend Engineer',
    'Frontend Engineer',
    'Fullstack Engineer',
    'Web Engineer',
    'Web3 Engineer',
    'Blockchain Engineer',
    'Smart Contract Engineer',
    'Solidity Developer',
    'Rust Developer',
    'Move Developer',
    'Protocol Engineer',
    'Infrastructure Engineer',
    'Cloud Engineer',
    'DevOps Engineer',
    'Site Reliability Engineer',
    'Platform Engineer',
    'AI/ML Engineer',
    'Machine Learning Engineer',
    'Deep Learning Engineer',
    'Data Engineer',
    'Data Scientist',
    'Data Analyst',
    'BI Engineer',
    'Mobile Developer',
    'iOS Developer',
    'Android Developer',
    'Flutter Developer',
    'React Native Developer',
    'Embedded Engineer',
    'IoT Engineer',
    'QA Engineer',
    'Automation Engineer',
    'Test Engineer',
    'Security Engineer',
    'Penetration Tester',
    'Smart Contract Auditor',
    'Game Developer',
    'Unity Developer',
    'Unreal Developer',
    'Graphics Engineer',
    'VR/AR Engineer',
    'System Architect',
    'Solution Architect',
    'Software Architect',
    'API Engineer',
    'Integration Engineer',
    'Performance Engineer',
    'Release Engineer',
    'Build Engineer',
    'Firmware Engineer',
    'Network Engineer',
    'Database Administrator',
    'Site Admin',

    // Product & Design
    'Product Manager',
    'Product Owner',
    'UI/UX Designer',
    'Graphic Designer',
    '3D Artist',
    'Motion Designer',

    // Community & Media
    'Media-Lead',
    'Content Creator',
    'Community Manager',
    'Social Media Manager',
    'Growth Hacker',
    'Event Organizer',

    // Research & Science
    'Researcher',
    'Scientist',
    'Academic Advisor',

    // Operations & Support
    'Operations',
    'Finance',
    'Legal',
    'Support',
    'HR',

    // General
    'Member',
    'Contributor',
    'Intern',
    'Mentor',
    'Advisor',
    'Ambassador',
    'Volunteer',
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
