import { Member, Event, Bounty, Repo, Resource, Project, Bank } from "../types";

// Re-export skills from the comprehensive library
export { AVAILABLE_SKILLS } from './skillsLibrary';

export const ROLES: string[] = [
    'President',
    'Vice-President',
    'Tech-Lead',
    'Media-Lead',
    'Member'
];

export const BANKS: Bank[] = [
    { id: '970422', name: 'Techcombank', code: 'TCB', bin: '970422', shortName: 'Techcombank', logo: '' },
    { id: '970407', name: 'Vietcombank', code: 'VCB', bin: '970407', shortName: 'Vietcombank', logo: '' },
    { id: '970405', name: 'VietinBank', code: 'CTG', bin: '970405', shortName: 'VietinBank', logo: '' },
    { id: '970415', name: 'Agribank', code: 'VBA', bin: '970415', shortName: 'Agribank', logo: '' },
    { id: '970403', name: 'BIDV', code: 'BIDV', bin: '970403', shortName: 'BIDV', logo: '' },
];

export const MEMBERS: Member[] = [];
export const EVENTS: Event[] = [];
export const PROJECTS: Project[] = [];
export const BOUNTIES: Bounty[] = [];
export const REPOS: Repo[] = [];
export const RESOURCES: Resource[] = [];

export default {};

// IMPORTANT: Mock database is in backend/src/mockDb.ts
