
import { Member, Event, Bounty, Repo, Resource, Bank, Project } from '../types';

export const MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Alex Nguyen',
    role: 'President',
    avatar: 'https://picsum.photos/seed/alex/200/200',
    skills: ['Rust', 'React', 'Solidity'],
    socials: { github: 'https://github.com/alexdev', twitter: 'https://x.com/alex_sol', telegram: 'https://t.me/alex_tg' },
    bankInfo: { bankId: '970422', accountNo: '000123456789' } // MB Bank
  },
  {
    id: '2',
    name: 'Sarah Tran',
    role: 'Media-Lead',
    avatar: 'https://picsum.photos/seed/sarah/200/200',
    skills: ['UI/UX Design', 'Graphic Design'],
    socials: { twitter: 'https://x.com/sarahtdesign' },
    bankInfo: { bankId: '970436', accountNo: '9876543210' } // VCB
  },
  {
    id: '3',
    name: 'Minh Le',
    role: 'Tech-Lead',
    avatar: 'https://picsum.photos/seed/minh/200/200',
    skills: ['TypeScript', 'Node.js', 'DevOps'],
    socials: { github: 'https://github.com/minhcode' }
  },
  {
    id: '4',
    name: 'Huy Hoang',
    role: 'Vice-President',
    avatar: 'https://picsum.photos/seed/huy/200/200',
    skills: ['Marketing', 'Community Mgmt'],
    socials: { twitter: 'https://x.com/huy_grow' }
  },
  {
    id: '5',
    name: 'Vy Pham',
    role: 'Tech-Member',
    avatar: 'https://picsum.photos/seed/vy/200/200',
    skills: ['React', 'Three.js'],
    socials: { github: 'https://github.com/vy_front' }
  },
];

export const EVENTS: Event[] = [
  {
    id: '1',
    title: 'Solana Rust Workshop',
    date: '2023-10-25',
    time: '18:00',
    type: 'Workshop',
    location: 'Room F101, DUT',
    attendees: 42
  },
  {
    id: '2',
    title: 'Superteam Hackathon Kickoff',
    date: '2023-11-02',
    time: '09:00',
    type: 'Hackathon',
    location: 'Maker Space',
    attendees: 120
  },
  {
    id: '3',
    title: 'Web3 Career Talk',
    date: '2023-11-15',
    time: '14:00',
    type: 'Social',
    location: 'Virtual (Discord)',
    attendees: 85
  }
];

export const BOUNTIES: Bounty[] = [
  {
    id: '1',
    title: 'Implement Token Swap UI',
    reward: '$250 USDC',
    difficulty: 'Medium',
    tags: ['React', 'Web3.js'],
    status: 'Open'
  },
  {
    id: '2',
    title: 'Design Landing Page Hero',
    reward: '$100 USDC',
    difficulty: 'Easy',
    tags: ['Figma', 'Design'],
    status: 'In Progress'
  },
  {
    id: '3',
    title: 'Optimize Rust Smart Contract',
    reward: '$500 USDC',
    difficulty: 'Hard',
    tags: ['Rust', 'Anchor'],
    status: 'Open'
  }
];

export const REPOS: Repo[] = [
  {
    id: '1',
    name: 'dsuc-landing-v2',
    description: 'The official landing page for DSUC Lab built with Next.js.',
    language: 'TypeScript',
    stars: 45,
    forks: 12
  },
  {
    id: '2',
    name: 'solana-voting-dapp',
    description: 'A decentralized voting application for student elections.',
    language: 'Rust',
    stars: 82,
    forks: 24
  },
  {
    id: '3',
    name: 'campus-wallet-sdk',
    description: 'SDK for integrating campus services with Solana wallet.',
    language: 'TypeScript',
    stars: 28,
    forks: 5
  }
];

export const RESOURCES: Resource[] = [
  { id: '1', name: 'Brand Kit 2024', type: 'Drive', url: '#', size: '24 MB', category: 'Media' },
  { id: '2', name: 'Solana Dev Handbook', type: 'Doc', url: '#', size: '1.2 MB', category: 'Learning' },
  { id: '3', name: 'Q4 Financial Report', type: 'Doc', url: '#', size: '500 KB', category: 'Document' },
  { id: '4', name: 'Hackathon Guidelines', type: 'Link', url: '#', category: 'Hackathon' },
  { id: '5', name: 'Meeting Minutes (Oct)', type: 'Doc', url: '#', size: '200 KB', category: 'Document' },
  { id: '6', name: 'Event Assets', type: 'Drive', url: '#', size: '150 MB', category: 'Media' },
];

export const BANKS: Bank[] = [
  { id: '970422', name: 'MB Bank', code: 'MB', bin: '970422', shortName: 'MBBank', logo: 'https://img.mservice.io/momo_app_v2/img/MBBank.png' },
  { id: '970436', name: 'Vietcombank', code: 'VCB', bin: '970436', shortName: 'Vietcombank', logo: 'https://img.mservice.io/momo_app_v2/img/Vietcombank.png' },
  { id: '970415', name: 'VietinBank', code: 'ICB', bin: '970415', shortName: 'VietinBank', logo: 'https://img.mservice.io/momo_app_v2/img/VietinBank.png' },
  { id: '970407', name: 'Techcombank', code: 'TCB', bin: '970407', shortName: 'Techcombank', logo: 'https://img.mservice.io/momo_app_v2/img/Techcombank.png' },
  { id: '970418', name: 'BIDV', code: 'BIDV', bin: '970418', shortName: 'BIDV', logo: 'https://img.mservice.io/momo_app_v2/img/BIDV.png' },
  { id: '970432', name: 'VPBank', code: 'VPB', bin: '970432', shortName: 'VPBank', logo: 'https://img.mservice.io/momo_app_v2/img/VPBank.png' },
];

export const PROJECTS: Project[] = [
  {
    id: '1',
    name: 'DSUC Official Hub',
    description: 'The central dashboard for club members to manage events, finance, and bounties.',
    category: 'Web3 Platform',
    builders: ['Vy Pham', 'Minh Le'],
    link: 'https://github.com/dsuc/hub',
    repoLink: 'https://github.com/dsuc/hub-repo'
  },
  {
    id: '2',
    name: 'SolVote',
    description: 'On-chain voting mechanism for selecting club leadership positions.',
    category: 'dApp',
    builders: ['Alex Nguyen'],
    link: 'https://github.com/dsuc/solvote',
    repoLink: 'https://github.com/dsuc/solvote-repo'
  },
  {
    id: '3',
    name: 'Crypto 101 Courseware',
    description: 'Interactive learning materials for new recruits.',
    category: 'Education',
    builders: ['Huy Hoang', 'Sarah Tran'],
    link: 'https://dsuc-edu.vercel.app',
    repoLink: 'https://github.com/dsuc/edu'
  },
  {
    id: '4',
    name: 'NFT Certificate Issuer',
    description: 'Automatically mints soulbound NFTs for workshop attendees.',
    category: 'Tooling',
    builders: ['Minh Le'],
    link: 'https://github.com/dsuc/nft-issuer',
    repoLink: 'https://github.com/dsuc/nft-issuer-repo'
  }
];

export const ROLES = [
  "President", 
  "Vice-President", 
  "Tech-Lead", 
  "Media-Lead", 
  "Tech-Member", 
  "Media-Member"
];

export const AVAILABLE_SKILLS = [
  "Rust", "Solidity", "React", "Next.js", "TypeScript", "Node.js", 
  "UI/UX Design", "Graphic Design", "Video Editing", "Content Writing",
  "Marketing", "Community Mgmt", "Project Mgmt", "DevOps", "Mobile Dev",
  "Three.js", "Anchor", "Smart Contracts"
];
