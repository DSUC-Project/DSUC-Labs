import { v4 as uuidv4 } from 'uuid';

// Types (simplified)
export interface Member {
  id: string;
  wallet_address: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  socials: any;
  bank_info: any;
  is_active?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  builders: string[];
  link: string;
  repo_link: string;
  status: string;
}

// Initial Data - Minimal mock data for local development
export const MOCK_DB = {
  members: [
    // PRESIDENT
    {
      id: '101240059',
      wallet_address: 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm',
      name: 'Zah',
      role: 'President',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Zah',
      skills: ['Web3', 'Rust', 'Design'],
      socials: { github: "https://github.com/lilzahs", twitter: "https://x.com/doandanh_zah", telegram: "https://t.me/doandanh_zah" },
      bank_info: { bankId: "970422", accountNo: "06271099999", accountName: "DOAN DO THANH DANH" },
      is_active: true
    },
    // VICE-PRESIDENT
    {
      id: '102240396',
      wallet_address: '9aieBQHrhou4GqRyNGgieXN8nZxK9uxWKHnvoyNL7NNB',
      name: 'Jerry',
      role: 'Vice-President',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jerry',
      skills: ['Marketing', 'Operations'],
      socials: { github: "https://github.com/jerry-ici", twitter: "https://x.com/jerryiciii", telegram: "https://t.me/jerryiciii" },
      bank_info: { bankId: "970436", accountNo: "1028328959", accountName: "LE THI THANH THAI" },
      is_active: true
    },
    {
      id: '101240060',
      wallet_address: 'GEeWZoVZq9JQ9RgWy9zzkhvTAnYBKSvS2gzjXetqutFe',
      name: 'Thodium',
      role: 'Vice-President',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Thodium',
      skills: ['HR Management', 'Event Planning', 'Community', 'Partnership'],
      socials: { github: "https://github.com/Th0dium", twitter: "https://x.com/Th0rdium", telegram: "https://t.me/Thodium04" },
      bank_info: { bankId: "970422", accountNo: "0347373213", accountName: "NGO VAN NHAT DUY" },
      is_active: true
    },
    // TECH-LEAD
    {
      id: '102240386',
      wallet_address: 'CYcvdzKjh8B699tbe3UnYM21Vzcp14JQqy5hXs9iUYBT',
      name: 'NekoNora',
      role: 'Tech-Lead',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=NekoNora',
      skills: ['Solana', 'Rust', 'React', 'TypeScript', 'System Design'],
      socials: { github: "https://github.com/thanhnhat23", twitter: "https://x.com/ThanhNhat06", telegram: "https://t.me/ThanhNhat23" },
      bank_info: { bankId: "970422", accountNo: "0905700494", accountName: "LUONG THANH NHAT" },
      is_active: true
    },
    // MEDIA-LEAD
    {
      id: '101240071',
      wallet_address: '9YYY8EWz4to5SH7N9K4qAuBNNLLxvVDeJw9TCpvhgDzw',
      name: 'Garoz',
      role: 'Media-Lead',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Garoz',
      skills: ['Content Creation', 'Social Media', 'Copywriting'],
      socials: { github: "https://github.com/Kunsosad", twitter: "https://x.com/darksans10", telegram: "https://t.me/Phanconghuy" },
      bank_info: { bankId: "970422", accountNo: "0987520146", accountName: "PHAN CONG HUY" },
      is_active: true
    },
    // MEMBERS
    {
      id: '123250164',
      wallet_address: 'FjTD1nP1PTR7cUu13tEBPciNe82sCiQ9qRvpkBeKxwxE',
      name: 'dainghia17',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dainghia17',
      skills: ['Editor', 'Media'],
      socials: { github: "https://github.com/dainghiax17-hub", twitter: "https://x.com/dainghiaaa17", telegram: "https://t.me/dainghiaaa17" },
      bank_info: { bankId: "970422", accountNo: "0356041438", accountName: "HUYNH DAI NGHIA" },
      is_active: true
    },
    {
      id: '123250208',
      wallet_address: 'C3mD3SDFjZrRrswBvDTf1p2R8UGhrvpbeqPqBWFg7rMi',
      name: 'TruongPhu1003',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=TruongPhu1003',
      skills: ['Python', 'AI/ML', 'Data Science'],
      socials: { github: "https://github.com/truongphu103", telegram: "https://t.me/TruongPhu103" },
      bank_info: { bankId: "970422", accountNo: "9100320079", accountName: "NGUYEN NGOC TRUONG PHU" },
      is_active: true
    },
    {
      id: '106250128',
      wallet_address: 'CDWSdzuLQ8nzKjc1UCNr8MbedAfEHZiqRFvvToWtnNiW',
      name: 'dhiern',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dhiern',
      skills: ['Solana', 'Anchor', 'Rust'],
      socials: { github: "https://github.com/d-hiern", twitter: "https://x.com/D_Hiern", telegram: "https://t.me/D_Hiern" },
      bank_info: { bankId: "970422", accountNo: "0812017500", accountName: "PHAN DUY HIEN" },
      is_active: true
    },
    {
      id: '102230313',
      wallet_address: 'BvCFiu95AfJBtXd4z2LyoLTrMahBKUCZJQcnCXSb6z3o',
      name: 'dhtphu05',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dhtphu05',
      skills: ['C++', 'Node.js', 'Next.js'],
      socials: { github: "https://github.com/dhtphu05", twitter: "https://x.com/dhtphu05", telegram: "https://t.me/dhtphu05" },
      bank_info: { bankId: "970436", accountNo: "1041537741", accountName: "DOAN HOANG THIEN PHU" },
      is_active: true
    },
    {
      id: '102240127',
      wallet_address: 'DBW3yKvtF5k61PdGYi1VzksGaukUvGT6bN9uwdvD4z5m',
      name: 'Kuwongg',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Kuwongg',
      skills: ['C++'],
      socials: { github: "https://github.com/Cuongkudo", twitter: "https://x.com/Cuongkudo123", telegram: "https://t.me/KuWongg" },
      bank_info: { bankId: "970415", accountNo: "100882221015", accountName: "NGUYEN MANH CUONG" },
      is_active: true
    },
    {
      id: '102240286',
      wallet_address: '7JzxzcgN6F1k2r4rPaZEBWmRb5HuCLJX3xVWdoJGGaKi',
      name: 'lacachua',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=lacachua',
      skills: ['Smart Contracts', 'Backend', 'C++'],
      socials: { github: "https://github.com/lacachua", twitter: "https://x.com/sh_jessica", telegram: "https://t.me/cachuane" },
      bank_info: { bankId: "970436", accountNo: "1024557336", accountName: "NGUYEN THI CAM TUYEN" },
      is_active: true
    },
    {
      id: '102230323',
      wallet_address: 'GAc9UQCBQpxkL2eGKFa8xBKKMTjDagA7MjHhGT51xxNc',
      name: 'Twii',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Twii',
      skills: ['Backend', 'PostgreSQL', 'Express'],
      socials: { github: "https://github.com/ntthuy29", twitter: "https://x.com/Thuy292005", telegram: "https://t.me/thuy2905" },
      bank_info: { bankId: "970415", accountNo: "0334105228", accountName: "NGUYEN THI THUY" },
      is_active: true
    },
    {
      id: '102240170',
      wallet_address: '46x1fCbdiooeqjDMsXsap3JEKFxHMCj1QUVwupeMXSP7',
      name: 'mtris',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mtris',
      skills: ['Next.js', 'C++'],
      socials: { github: "https://github.com/mtris134", twitter: "https://x.com/mtris134", telegram: "https://t.me/mtris134" },
      bank_info: { bankId: "970436", accountNo: "9365603556", accountName: "LE MINH TRI" },
      is_active: true
    },
    {
      id: '102250190',
      wallet_address: 'DZwUcn3ssXZYdxmnMW3JDwDCjKTx66x7ztLDxvv49B6L',
      name: 'fuong',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=fuong',
      skills: ['Rust', 'VibeCode', 'C++'],
      socials: { github: "https://github.com/PHUOBG", twitter: "https://x.com/Phuongloppi", telegram: "https://t.me/Loppygirll" },
      bank_info: { bankId: "970422", accountNo: "0326616401", accountName: "HOANG THI NGOC PHUONG" },
      is_active: true
    },
    {
      id: '102240261',
      wallet_address: 'fHdTXZmGfNmtN5fwErNHzX4RtKyjiWC8sahg7QkQT6K',
      name: 'Lilithium',
      role: 'Member',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lilithium',
      skills: ['Design', 'Next.js', 'TypeScript'],
      socials: { github: "https://github.com/Liinh-Git", twitter: "https://x.com/NguynLinh298772", telegram: "https://t.me/Kaslynna" },
      bank_info: { bankId: "970422", accountNo: "0865371670", accountName: "NGUYEN DO KHANH LINH" },
      is_active: true
    }
  ] as Member[],

  projects: [
    {
      id: 'proj-001',
      name: "DSUC Portal",
      description: "The main portal for DSUC members.",
      category: "Web3",
      builders: ["Thodium", "NekoNora"],
      link: "https://dsuc.fun",
      repo_link: "https://github.com/dsuc-labs/portal",
      status: "Active"
    },
    {
      id: 'proj-002',
      name: "Discord Bot",
      description: "Community management bot for DSUC Discord server.",
      category: "Tools",
      builders: ["NekoNora"],
      link: "",
      repo_link: "https://github.com/dsuc-labs/discord-bot",
      status: "Active"
    }
  ] as Project[],

  finance_requests: [
    {
      id: 'fin-req-001',
      requester_id: '101240060',
      requester_name: 'Thodium',
      amount: 500000,
      reason: 'DSUC Event Catering',
      date: '2025-12-08',
      bill_image: 'https://via.placeholder.com/400x300?text=Bill',
      status: 'pending',
      created_at: '2025-12-01T10:30:00Z'
    },
    {
      id: 'fin-req-002',
      requester_id: '102240386',
      requester_name: 'NekoNora',
      amount: 300000,
      reason: 'Server hosting Q4 2024',
      date: '2025-11-25',
      bill_image: 'https://via.placeholder.com/400x300?text=Bill',
      status: 'completed',
      processed_by: '101240060',
      processed_at: '2025-11-26T09:00:00Z',
      created_at: '2025-11-25T08:00:00Z'
    }
  ] as any[],

  finance_history: [
    {
      id: 'fin-hist-001',
      requester_id: '102240386',
      requester_name: 'NekoNora',
      amount: 300000,
      reason: 'Server hosting Q4 2024',
      date: '2025-11-25',
      bill_image: 'https://via.placeholder.com/400x300?text=Bill',
      status: 'completed',
      processed_by: '101240060',
      processed_by_name: 'Thodium',
      processed_at: '2025-11-26T09:00:00Z',
      created_at: '2025-11-25T08:00:00Z'
    },
    {
      id: 'fin-hist-002',
      requester_id: '101240060',
      requester_name: 'Thodium',
      amount: 200000,
      reason: 'Workshop equipment',
      date: '2025-11-15',
      bill_image: 'https://via.placeholder.com/400x300?text=Bill',
      status: 'completed',
      processed_by: '102240386',
      processed_by_name: 'NekoNora',
      processed_at: '2025-11-16T11:30:00Z',
      created_at: '2025-11-15T10:00:00Z'
    }
  ] as any[],

  events: [
    {
      id: 'evt-001',
      title: 'Solana Development Workshop',
      date: '2025-12-10',
      time: '14:00',
      type: 'Workshop',
      location: 'HCMC Tech Hub, District 1',
      attendees: 25,
      created_by: '102240386',
      luma_link: 'https://lu.ma/dsuc-solana-workshop',
      created_at: '2025-12-01T09:00:00Z'
    },
    {
      id: 'evt-002',
      title: 'Web3 Hackathon 2025',
      date: '2025-12-28',
      time: '08:00',
      type: 'Hackathon',
      location: 'Online',
      attendees: 42,
      created_by: '101240060',
      luma_link: 'https://lu.ma/dsuc-hackathon-2025',
      created_at: '2025-12-01T11:00:00Z'
    }
  ] as any[],

  bounties: [
    {
      id: 'bounty-001',
      title: 'Fix Discord Bot /help Command',
      description: 'Implement missing autocomplete feature for /help command',
      reward: 50000,
      difficulty: 'Easy',
      tags: ['Discord.js', 'TypeScript', 'Bot'],
      status: 'Open',
      submit_link: 'https://github.com/dsuc-labs/discord-bot/issues/12',
      created_by: '102240386',
      created_at: '2025-12-01T11:00:00Z'
    },
    {
      id: 'bounty-002',
      title: 'Add Dark Mode to Portal',
      description: 'Implement dark/light theme switching',
      reward: 100000,
      difficulty: 'Medium',
      tags: ['React', 'CSS', 'UI/UX'],
      status: 'Open',
      submit_link: 'https://github.com/dsuc-labs/portal/issues/5',
      created_by: '101240060',
      created_at: '2025-12-02T09:30:00Z'
    }
  ] as any[],

  repos: [
    {
      id: 'repo-001',
      name: 'DSUC Portal',
      description: 'Main portal for DSUC members',
      language: 'TypeScript/React',
      url: 'https://github.com/dsuc-labs/portal',
      stars: 42,
      forks: 12,
      created_by: '102240386',
      created_at: '2025-11-15T08:00:00Z'
    },
    {
      id: 'repo-002',
      name: 'Discord Bot',
      description: 'Community management bot',
      language: 'TypeScript/Discord.js',
      url: 'https://github.com/dsuc-labs/discord-bot',
      stars: 18,
      forks: 5,
      created_by: '101240060',
      created_at: '2025-11-20T10:00:00Z'
    }
  ] as any[],

  resources: [
    {
      id: 'res-001',
      title: 'Solana Development Guide',
      description: 'Complete guide to building on Solana',
      url: 'https://docs.solana.com',
      category: 'Documentation',
      created_by: '102240386',
      created_at: '2025-11-01T10:00:00Z'
    }
  ] as any[]
};

// Helper to create chainable query builder
const createBuilder = (data: any[]) => {
  const builder = {
    data,
    error: null,

    select: () => builder,

    eq: (column: string, value: any) => {
      const filtered = data.filter((item: any) => item[column] === value);
      return createBuilder(filtered);
    },

    in: (column: string, values: any[]) => {
      const filtered = data.filter((item: any) => values.includes(item[column]));
      return createBuilder(filtered);
    },

    not: (column: string, operator: string, value: any) => {
      const filtered = data.filter((item: any) => {
        if (operator === 'is') return item[column] !== value;
        return true;
      });
      return createBuilder(filtered);
    },

    gte: (column: string, value: any) => {
      const filtered = data.filter((item: any) => item[column] >= value);
      return createBuilder(filtered);
    },

    limit: (count: number) => {
      return createBuilder(data.slice(0, count));
    },

    order: (column: string, options: { ascending: boolean }) => {
      const sorted = [...data].sort((a: any, b: any) => {
        const aVal = a[column], bVal = b[column];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.ascending ? cmp : -cmp;
      });
      return createBuilder(sorted);
    },

    single: () => ({
      data: data[0] || null,
      error: data.length === 0 ? { message: 'Not found', code: '404', details: '', hint: '' } : null
    })
  };
  return builder;
};

// Mock Database API (mimics Supabase API structure)
export const mockDb = {
  from: (table: keyof typeof MOCK_DB) => ({
    select: (columns: string = '*') => {
      return createBuilder(MOCK_DB[table]);
    },

    insert: (records: any[]) => {
      const newRecords = records.map(record => ({
        ...record,
        id: record.id || uuidv4(),
        created_at: record.created_at || new Date().toISOString()
      }));

      (MOCK_DB[table] as any[]).push(...newRecords);

      return {
        data: newRecords,
        error: null,
        select: () => createBuilder(newRecords)
      };
    },

    update: (updates: any) => ({
      eq: (column: string, value: any) => {
        const items = MOCK_DB[table] as any[];
        const index = items.findIndex((item: any) => item[column] === value);

        if (index === -1) {
          return {
            data: null,
            error: { message: 'Not found', code: '404', details: '', hint: '' },
            select: () => createBuilder([])
          };
        }

        items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };

        return {
          data: items[index],
          error: null,
          select: () => createBuilder([items[index]])
        };
      }
    }),

    delete: () => ({
      eq: (column: string, value: any) => {
        const items = MOCK_DB[table] as any[];
        const index = items.findIndex((item: any) => item[column] === value);

        if (index === -1) {
          return { data: null, error: { message: 'Not found', code: '404', details: '', hint: '' } };
        }

        items.splice(index, 1);
        return { data: { id: value }, error: null };
      }
    })
  })
};
