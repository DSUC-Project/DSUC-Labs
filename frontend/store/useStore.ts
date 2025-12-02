import { create } from "zustand";
import {
  FinanceRequest,
  Event,
  Bounty,
  Repo,
  Resource,
  Member,
  Project,
} from "../types";
import {
  EVENTS,
  BOUNTIES,
  REPOS,
  RESOURCES,
  MEMBERS,
  PROJECTS,
} from "../data/mockData";

declare global {
  interface Window {
    solana?: any;
    solflare?: any;
  }
}

interface AppState {
  isWalletConnected: boolean;
  walletAddress: string | null;
  walletProvider: "Phantom" | "Solflare" | null;
  currentUser: Member | null; // The logged-in user's profile

  connectWallet: (provider: "Phantom" | "Solflare") => void;
  disconnectWallet: () => void;
  fetchMembers: () => Promise<void>;
  fetchFinanceHistory: () => Promise<void>;

  // Data Lists
  members: Member[]; // Mutable members list
  events: Event[];
  bounties: Bounty[];
  repos: Repo[];
  resources: Resource[];
  projects: Project[];
  financeRequests: FinanceRequest[];
  financeHistory: FinanceRequest[];

  // Actions
  addEvent: (event: Event) => void;
  addBounty: (bounty: Bounty) => void;
  addRepo: (repo: Repo) => void;
  addResource: (resource: Resource) => void;
  addProject: (project: Project) => void;

  submitFinanceRequest: (req: FinanceRequest) => Promise<void>;
  approveFinanceRequest: (id: string) => Promise<void>;
  rejectFinanceRequest: (id: string) => Promise<void>;
  fetchPendingRequests: () => Promise<void>;

  updateCurrentUser: (updates: Partial<Member>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  isWalletConnected: false,
  walletAddress: null,
  walletProvider: null,
  currentUser: null,

  members: [], // Initialize empty, will be fetched from backend
  events: EVENTS,
  bounties: BOUNTIES,
  repos: REPOS,
  resources: RESOURCES,
  projects: PROJECTS,
  financeRequests: [],
  financeHistory: [],

  // Fetch members from backend
  fetchMembers: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/api/members`);
      if (res.ok) {
        const result = await res.json();
        if (result && result.success && result.data) {
          // Normalize backend data: map bank_info to bankInfo
          const members = result.data.map((m: any) => ({
            ...m,
            bankInfo: m.bank_info || m.bankInfo,
          }));
          set({ members });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch members from backend", e);
      // Fallback to mock data if backend fails
      set({ members: MEMBERS });
    }
  },

  // Fetch finance history from backend
  fetchFinanceHistory: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/api/finance-history`);
      if (res.ok) {
        const result = await res.json();
        if (result && result.success && result.data) {
          set({ financeHistory: result.data });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch finance history", e);
    }
  },

  connectWallet: async (provider) => {
    try {
      let addr: string | null = null;
      if (provider === "Phantom" && window.solana && window.solana.isPhantom) {
        const resp = await window.solana.connect();
        addr = resp?.publicKey?.toString() ?? null;
      } else if (provider === "Solflare" && window.solflare) {
        const resp = await window.solflare.connect();
        addr = resp?.publicKey?.toString() ?? resp?.publicKey ?? null;
      } else {
        console.warn("Wallet provider not found");
      }

      if (!addr) {
        set({ isWalletConnected: false });
        return;
      }

      set({
        isWalletConnected: true,
        walletAddress: addr,
        walletProvider: provider,
      });

      // Try to get/create member profile from backend
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || "";
        const res = await fetch(`${base}/api/auth/wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: addr }),
        });
        if (res.ok) {
          const result = await res.json();
          if (result && result.success && result.data) {
            const profile = result.data;
            // if backend returns member, ensure it's in members list
            set((state) => ({
              currentUser: profile,
              members: state.members.some((m) => m.id === profile.id)
                ? state.members
                : [profile, ...state.members],
            }));
            return;
          }
        }
      } catch (e) {
        console.warn("Backend auth failed", e);
      }

      // Fallback: match by wallet locally if mock data exists
      const state = get();
      const found = state.members.find(
        (m) =>
          (m as any).wallet_address === addr ||
          (m as any).walletAddress === addr
      );
      if (found) set({ currentUser: found });
    } catch (err) {
      console.error("connectWallet error", err);
      set({
        isWalletConnected: false,
        walletAddress: null,
        walletProvider: null,
      });
    }
  },

  disconnectWallet: () =>
    set({
      isWalletConnected: false,
      walletAddress: null,
      walletProvider: null,
      currentUser: null,
    }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  addBounty: (bounty) =>
    set((state) => ({ bounties: [...state.bounties, bounty] })),
  addRepo: (repo) => set((state) => ({ repos: [...state.repos, repo] })),
  addResource: (resource) =>
    set((state) => ({ resources: [...state.resources, resource] })),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  // Submit finance request to backend
  submitFinanceRequest: async (req) => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const state = get();

      if (!state.currentUser || !state.walletAddress) {
        console.error("User not authenticated");
        return;
      }

      const res = await fetch(`${base}/api/finance/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": state.walletAddress,
        },
        body: JSON.stringify({
          amount: req.amount,
          reason: req.reason,
          date: req.date,
          bill_image: req.billImage,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result && result.success && result.data) {
          // Add to local state
          set((state) => ({
            financeRequests: [...state.financeRequests, result.data],
          }));
        }
      } else {
        console.error("Failed to submit finance request");
      }
    } catch (e) {
      console.error("Error submitting finance request:", e);
    }
  },

  // Fetch pending requests from backend
  fetchPendingRequests: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const state = get();

      if (!state.currentUser || !state.walletAddress) {
        return;
      }

      const res = await fetch(`${base}/api/finance/pending`, {
        headers: {
          "x-wallet-address": state.walletAddress,
        },
      });

      if (res.ok) {
        const result = await res.json();
        if (result && result.success && result.data) {
          set({ financeRequests: result.data });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch pending requests", e);
    }
  },

  // Approve finance request via backend
  approveFinanceRequest: async (id) => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const state = get();

      if (!state.currentUser || !state.walletAddress) {
        console.error("User not authenticated");
        return;
      }

      const res = await fetch(`${base}/api/finance/approve/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": state.walletAddress,
        },
      });

      if (res.ok) {
        // Remove from pending and refresh history
        set((state) => ({
          financeRequests: state.financeRequests.filter((r) => r.id !== id),
        }));
        // Refresh finance history
        state.fetchFinanceHistory();
      } else {
        console.error("Failed to approve request");
      }
    } catch (e) {
      console.error("Error approving request:", e);
    }
  },

  // Reject finance request via backend
  rejectFinanceRequest: async (id) => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const state = get();

      if (!state.currentUser || !state.walletAddress) {
        console.error("User not authenticated");
        return;
      }

      const res = await fetch(`${base}/api/finance/reject/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": state.walletAddress,
        },
      });

      if (res.ok) {
        // Remove from pending and refresh history
        set((state) => ({
          financeRequests: state.financeRequests.filter((r) => r.id !== id),
        }));
        // Refresh finance history
        state.fetchFinanceHistory();
      } else {
        console.error("Failed to reject request");
      }
    } catch (e) {
      console.error("Error rejecting request:", e);
    }
  },

  updateCurrentUser: (updates) =>
    set((state) => {
      if (!state.currentUser) return state;

      const updatedUser = { ...state.currentUser, ...updates };

      // Also update this user in the main members list so changes are visible publicly
      const updatedMembers = state.members.map((m) =>
        m.id === updatedUser.id ? updatedUser : m
      );

      return {
        currentUser: updatedUser,
        members: updatedMembers,
      };
    }),
}));
