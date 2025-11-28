
import { Member, Event, Bounty, Repo, Resource, Bank, Project } from '../types';

export const MEMBERS: Member[] = [
  {
    id: '101240059',
    name: 'Zah',
    role: 'President',
    avatar: 'zahnft.png',
    skills: ['Rust', 'React', 'Solidity'],
    socials: { github: 'https://github.com/lilzahs', twitter: 'https://x.com/doandanh_zah', telegram: 'https://t.me/doandanh_zah' },
    bankInfo: { bankId: '970422', accountNo: '06271099999' } // MB Bank
  },
  {
    id: '102240396',
    name: 'Jerry',
    role: 'Vice-President',
    avatar: 'https://picsum.photos/seed/sarah/200/200',
    skills: ['UI/UX Design', 'Graphic Design'],
    socials: { twitter: 'https://x.com/jerry_icy' },
    bankInfo: { bankId: '970436', accountNo: '1028328959' } // VCB
  },
  {
    id: '101240060',
    name: 'Thodium',
    role: 'Vice-President',
    avatar: 'https://picsum.photos/seed/minh/200/200',
    skills: ['TypeScript', 'Solidity', 'Rust'],
    socials: { github: 'https://github.com/thodium', twitter: 'https://x.com/Th0rDium' }
  },
  {
    id: '101240386',
    name: 'Neko Nora',
    role: 'Tech-Lead',
    avatar: 'https://picsum.photos/seed/huy/200/200',
    skills: ['Rust', 'Next.js', 'TypeScript'],
    socials: { twitter: 'https://x.com/nekonora' }
  },
  {
    id: '101240071',
    name: 'Huyz',
    role: 'Media-Lead',
    avatar: 'https://picsum.photos/seed/vy/200/200',
    skills: ['Marketing', 'Next.js', 'Content Writing'],
    socials: { github: 'https://github.com/phanconghuy' }
  },
];

export const EVENTS: Event[] = [
  {
    id: '0001',
    title: 'SuperteamVN Demo Day',
    date: '2025-11-29',
    time: '8:00',
    type: 'Workshop',
    location: 'Galaxy Innovation Hub, Ho Chi Minh City',
    attendees: 132
  },
  {
    id: '0002',
    title: 'Solana University Hackathon Kickoff',
    date: '2025-12-01',
    time: '09:00',
    type: 'Hackathon',
    location: 'Online',
    attendees: 120
  },
  {
    id: '0003',
    title: 'Solana Danang Connection 2025: Soccer Match 7:30pm 5/12',
    date: '2025-12-05',
    time: '19:00',
    type: 'Social',
    location: 'Cao Thang soccer mini field, Danang',
    attendees: 15
  }
];

export const BOUNTIES: Bounty[] = [
  {
    id: '1',
    title: 'Token Swap',
    reward: '200k VND',
    difficulty: 'Medium',
    tags: ['React', 'Rust'],
    status: 'Open'
  },
  {
    id: '2',
    title: 'Design Landing Page',
    reward: '100k VND',
    difficulty: 'Easy',
    tags: ['Figma', 'Design'],
    status: 'In Progress'
  },
  {
    id: '3',
    title: 'Write Conntent introduce about DSUC',
    reward: '200k VND',
    difficulty: 'Easy',
    tags: ['Content', 'Media'],
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
    name: 'DSUC Labs',
    description: 'Official Web3 platform for DSUC members to showcase projects and collaborate.',
    category: 'Web3 Platform',
    builders: ['Zah'],
    link: 'https://dsuc.fun',
    repoLink: 'https://github.com/DSUC-Project/DSUC-Labs'
  },
  {
    id: '2',
    name: 'Gimme Idea',
    description: 'Share ideas and get feedback from community and AI.',
    category: 'Social',
    builders: ['Zah', 'Thodium'],
    link: 'https://gimmeidea.com',
    repoLink: 'https://github.com/lilzahs/Gimme-Idea'
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
