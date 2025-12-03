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
    {
      id: '101240060',
      wallet_address: 'GEeWZoVZq9JQ9RgWy9zzkhvTAnYBKSvS2gzjXetqutFe',
      name: 'Thodium',
      role: 'Vice-President',
      avatar: 'https://via.placeholder.com/150x150?text=Thodium',
      skills: ['HR Management', 'Event Planning', 'Community', 'Partnership'],
      socials: { github: "https://github.com/Th0dium", twitter: "https://x.com/Th0rdium", telegram: "https://t.me/Thodium04" },
      bank_info: { bankId: "970422", accountNo: "0347373213", accountName: "NGO VAN NHAT DUY" },
      is_active: true
    },
    {
      id: '102240386',
      wallet_address: 'CYcvdzKjh8B699tbe3UnYM21Vzcp14JQqy5hXs9iUYBT',
      name: 'NekoNora',
      role: 'Tech-Lead',
      avatar: 'https://via.placeholder.com/150x150?text=NekoNora',
      skills: ['Solana', 'Rust', 'React', 'TypeScript', 'System Design'],
      socials: { github: "https://github.com/thanhnhat23", twitter: "https://x.com/ThanhNhat06", telegram: "https://t.me/ThanhNhat23" },
      bank_info: { bankId: "970422", accountNo: "0905700494", accountName: "LUONG THANH NHAT" },
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
