import { create } from "zustand";
import {
  FinanceRequest,
  Event,
  Bounty,
  Repo,
  Resource,
  Member,
  Project,
  AuthMethod,
  AuthIntent,
  GoogleUserInfo,
} from "../types";
import {
  EVENTS,
  BOUNTIES,
  REPOS,
  RESOURCES,
  MEMBERS,
  PROJECTS,
} from "../data/mockData";
import { readCache, writeCache } from "../lib/cache";

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
  authMethod: AuthMethod | null; // 'wallet' or 'google'
  authToken: string | null; // JWT token for Google auth

  // Backend Status
  backendStatus: 'connecting' | 'online' | 'offline';
  warmupBackend: () => Promise<void>;

  connectWallet: (provider: "Phantom" | "Solflare") => void;
  reconnectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loginWithGoogle: (
    googleUserInfo: GoogleUserInfo,
    intent?: AuthIntent
  ) => Promise<boolean>;
  linkGoogleAccount: (googleUserInfo: GoogleUserInfo) => Promise<boolean>;
  checkSession: () => Promise<void>;
  logout: () => void;
  fetchMembers: () => Promise<void>;
  fetchFinanceHistory: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchResources: () => Promise<void>;
  fetchBounties: () => Promise<void>;
  fetchRepos: () => Promise<void>;

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

const PUBLIC_CACHE_TTL_MS = 1000 * 60 * 30;

function normalizeMember(raw: any): Member {
  const rawBankInfo = raw?.bank_info || raw?.bankInfo;
  const memberType = raw?.member_type === "community" ? "community" : "member";

  return {
    ...raw,
    memberType,
    academyAccess: raw?.academy_access !== false,
    profile_completed: raw?.profile_completed !== false,
    bankInfo: rawBankInfo
      ? {
          bankId: rawBankInfo.bankId || rawBankInfo.bank_id,
          accountNo: rawBankInfo.accountNo || rawBankInfo.account_no,
          accountName: rawBankInfo.accountName || rawBankInfo.account_name,
        }
      : null,
  };
}

function normalizeBounty(raw: any): Bounty {
  return {
    ...raw,
    submitLink: raw?.submitLink || raw?.submit_link || undefined,
  };
}

function normalizeRepo(raw: any): Repo {
  return {
    ...raw,
    repoLink: raw?.repoLink || raw?.url || undefined,
  };
}

function getAuthHeaders(
  state: Pick<AppState, "walletAddress" | "authToken">,
  includeJson = false
) {
  const headers: Record<string, string> = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (state.authToken) {
    headers.Authorization = `Bearer ${state.authToken}`;
  } else if (state.walletAddress) {
    headers["x-wallet-address"] = state.walletAddress;
  }

  return headers;
}

function canManageClubData(state: Pick<AppState, "currentUser">) {
  return state.currentUser?.memberType === "member";
}

export const useStore = create<AppState>((set, get) => ({
  isWalletConnected: false,
  walletAddress: null,
  walletProvider: null,
  currentUser: null,
  authMethod: null,
  authToken: null,
  backendStatus: 'connecting',

  members: readCache<Member[]>("members", PUBLIC_CACHE_TTL_MS) || [],
  events: readCache<Event[]>("events", PUBLIC_CACHE_TTL_MS) || EVENTS,
  bounties: readCache<Bounty[]>("bounties", PUBLIC_CACHE_TTL_MS) || BOUNTIES,
  repos: readCache<Repo[]>("repos", PUBLIC_CACHE_TTL_MS) || REPOS,
  resources:
    readCache<Resource[]>("resources", PUBLIC_CACHE_TTL_MS) || RESOURCES,
  projects: readCache<Project[]>("projects", PUBLIC_CACHE_TTL_MS) || PROJECTS,
  financeRequests: [],
  financeHistory:
    readCache<FinanceRequest[]>("financeHistory", PUBLIC_CACHE_TTL_MS) || [],

  // Warmup backend - ping to wake it up logic
  warmupBackend: async () => {
    const base = (import.meta as any).env.VITE_API_BASE_URL || "";
    console.log('[warmupBackend] Starting backend warmup sequence at:', base);
    set({ backendStatus: 'connecting' });

    const startTime = Date.now();
    const INITIALIZING_TIMEOUT = 24000; // 24 seconds allowed for "connecting" state

    const ping = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s fetch timeout

        const res = await fetch(`${base}/api/health`, {
          signal: controller.signal,
        }).catch(() => null); // Catch network errors silently

        clearTimeout(timeout);
        return res?.ok;
      } catch {
        return false;
      }
    };

    // Polling loop
    while (true) {
      const isOnline = await ping();

      if (isOnline) {
        console.log('[warmupBackend] Backend is online!');
        set({ backendStatus: 'online' });
        break; // Stop checking once online
      }

      // If still here, it failed. Check constraints.
      const elapsed = Date.now() - startTime;

      if (elapsed > INITIALIZING_TIMEOUT) {
        // Only show "offline" after the 60s grace period
        set({ backendStatus: 'offline' });
        console.log('[warmupBackend] Backend still unreachable. Retrying in 5s...');
        await new Promise(r => setTimeout(r, 5000)); // Wait 5s before retry
      } else {
        // Still in "Initializing" phase
        console.log(`[warmupBackend] Waking up... (${Math.round(elapsed / 1000)}s)`);
        await new Promise(r => setTimeout(r, 2000)); // Quick retry every 2s while initializing
      }
    }
  },

  // Fetch members from backend
  fetchMembers: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchMembers] API Base URL:", base);
      const url = `${base}/api/members`;
      console.log("[fetchMembers] Fetching from:", url);

      const res = await fetch(url);
      console.log("[fetchMembers] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[fetchMembers] Result:", result);

        if (result && result.success && result.data) {
          const members = result.data.map(normalizeMember);
          console.log("[fetchMembers] Setting members:", members.length);
          set({ members });
          writeCache("members", members);
        }
      } else {
        console.error(
          "[fetchMembers] Response not OK:",
          res.status,
          res.statusText
        );
      }
    } catch (e) {
      console.error("Failed to fetch members from backend", e);
      // Fallback to mock data if backend fails
      set({ members: MEMBERS.map(normalizeMember) });
    }
  },

  // Fetch finance history from backend
  fetchFinanceHistory: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/api/finance-history`);
      if (res.ok) {
        const result = await res.json();
        console.log("[fetchFinanceHistory] Raw result:", result);
        if (result && result.success && result.data) {
          // Normalize snake_case to camelCase
          const history = result.data.map((r: any) => ({
            id: r.id,
            amount: r.amount,
            reason: r.reason,
            date: r.date,
            billImage: r.bill_image || r.billImage,
            status: r.status,
            requesterName: r.requester_name || r.requesterName,
            requesterId: r.requester_id || r.requesterId,
          }));
          console.log("[fetchFinanceHistory] Normalized history:", history);
          set({ financeHistory: history });
          writeCache("financeHistory", history);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch finance history", e);
    }
  },

  // Fetch events from backend
  fetchEvents: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchEvents] Fetching from:", `${base}/api/events`);
      const res = await fetch(`${base}/api/events`);
      if (res.ok) {
        const result = await res.json();
        console.log("[fetchEvents] Raw result:", result);
        if (result && result.success && result.data) {
          // Normalize snake_case to camelCase
          const events = result.data.map((e: any) => ({
            ...e,
            luma_link: e.luma_link || e.luma_link,
          }));
          console.log("[fetchEvents] Normalized events:", events);
          set({ events });
          writeCache("events", events);
        }
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
      set({ events: EVENTS });
    }
  },

  // Fetch projects from backend
  fetchProjects: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchProjects] Fetching from:", `${base}/api/projects`);
      const res = await fetch(`${base}/api/projects`);
      if (res.ok) {
        const result = await res.json();
        console.log("[fetchProjects] Result:", result);
        if (result && result.success && result.data) {
          set({ projects: result.data });
          writeCache("projects", result.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
      set({ projects: PROJECTS });
    }
  },

  // Fetch resources from backend
  fetchResources: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchResources] Fetching from:", `${base}/api/resources`);
      const res = await fetch(`${base}/api/resources`);
      if (res.ok) {
        const result = await res.json();
        console.log("[fetchResources] Result:", result);
        if (result && result.success && result.data) {
          set({ resources: result.data });
          writeCache("resources", result.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch resources", e);
      set({ resources: RESOURCES });
    }
  },

  // Fetch bounties from backend
  fetchBounties: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log(
        "[fetchBounties] Fetching from:",
        `${base}/api/work/bounties`
      );
      const res = await fetch(`${base}/api/work/bounties`);
      if (res.ok) {
        const result = await res.json();
        console.log("[fetchBounties] Result:", result);
        if (result && result.success && result.data) {
          const normalized = result.data.map(normalizeBounty);
          set({ bounties: normalized });
          writeCache("bounties", normalized);
        }
      }
    } catch (e) {
      console.error("Failed to fetch bounties", e);
      set({ bounties: BOUNTIES });
    }
  },

  // Fetch repos from backend
  fetchRepos: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchRepos] Fetching from:", `${base}/api/work/repos`);
      const res = await fetch(`${base}/api/work/repos`);
      if (res.ok) {
        const result = await res.json();
        console.log("[fetchRepos] Result:", result);
        if (result && result.success && result.data) {
          const normalized = result.data.map(normalizeRepo);
          set({ repos: normalized });
          writeCache("repos", normalized);
        }
      }
    } catch (e) {
      console.error("Failed to fetch repos", e);
      set({ repos: REPOS });
    }
  },

  connectWallet: async (provider) => {
    try {
      let addr: string | null = null;

      console.log("[connectWallet] Provider:", provider);
      console.log("[connectWallet] window.solana:", window.solana);
      console.log("[connectWallet] window.solflare:", window.solflare);

      if (provider === "Phantom" && window.solana && window.solana.isPhantom) {
        const resp = await window.solana.connect();
        console.log("[connectWallet] Phantom response:", resp);
        addr = resp?.publicKey?.toString() ?? null;
      } else if (provider === "Solflare" && window.solflare) {
        // Solflare có thể cần kiểm tra isConnected hoặc connect trước
        if (!window.solflare.isConnected) {
          await window.solflare.connect();
        }
        // Lấy publicKey từ solflare - có thể là property trực tiếp
        const publicKey = window.solflare.publicKey;
        console.log("[connectWallet] Solflare publicKey:", publicKey);

        if (publicKey) {
          // publicKey có thể là object với toString() hoặc string trực tiếp
          addr =
            typeof publicKey === "string" ? publicKey : publicKey.toString();
        }
      } else {
        console.warn("Wallet provider not found");
        alert(
          `${provider} is not installed or not available. Please install the ${provider} extension.`
        );
        return;
      }

      console.log("[connectWallet] Final address:", addr);

      if (!addr) {
        set({ isWalletConnected: false });
        return;
      }

      set({
        isWalletConnected: true,
        walletAddress: addr,
        walletProvider: provider,
        authMethod: "wallet",
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
            const profile = normalizeMember(result.data);
            // if backend returns member, ensure it's in members list
            set((state) => ({
              currentUser: profile,
              authMethod: "wallet",
              authToken: null,
              members: (() => {
                const members = state.members.some((m) => m.id === profile.id)
                  ? state.members.map((member) =>
                      member.id === profile.id ? profile : member
                    )
                  : [profile, ...state.members];
                writeCache("members", members);
                return members;
              })(),
            }));
            return;
          } else {
            // Backend responded OK but no member found
            alert(
              "❌ NOT A CLUB MEMBER\n\nYour wallet is not registered in the system.\nPlease register to use the website!"
            );
            set({
              isWalletConnected: false,
              walletAddress: null,
              walletProvider: null,
              authMethod: null,
            });
            return;
          }
        } else {
          // Backend error - member not found
          console.warn("Backend auth failed - member not found");
          alert(
            "❌ NOT A CLUB MEMBER\n\nYour wallet is not registered in the system.\nPlease register to use the website!"
          );
          set({
            isWalletConnected: false,
            walletAddress: null,
            walletProvider: null,
            authMethod: null,
          });
          return;
        }
      } catch (e) {
        console.warn("Backend auth failed", e);
        // Network error - show generic message
        alert(
          "❌ AUTHENTICATION FAILED\n\nCannot connect to server. Please try again later."
        );
        set({
          isWalletConnected: false,
          walletAddress: null,
          walletProvider: null,
          authMethod: null,
        });
        return;
      }
    } catch (err) {
      console.error("connectWallet error", err);
      set({
        isWalletConnected: false,
        walletAddress: null,
        walletProvider: null,
        authMethod: null,
      });
    }
  },

  reconnectWallet: async () => {
    const state = get();
    if (!state.walletProvider) {
      return;
    }

    await state.connectWallet(state.walletProvider);
  },

  disconnectWallet: () =>
    set({
      isWalletConnected: false,
      walletAddress: null,
      walletProvider: null,
      currentUser: null,
      authMethod: null,
      authToken: null,
    }),

  // Login with Google - for users who have email pre-registered
  loginWithGoogle: async (
    googleUserInfo: GoogleUserInfo,
    intent: AuthIntent = "login"
  ) => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[loginWithGoogle] Attempting login with:", googleUserInfo.email);

      const res = await fetch(`${base}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: googleUserInfo.email,
          google_id: googleUserInfo.google_id,
          name: googleUserInfo.name,
          avatar: googleUserInfo.avatar,
          intent,
        }),
      });

      const result = await res.json();
      console.log("[loginWithGoogle] Result:", result);

      if (res.ok && result.success) {
        const profile = normalizeMember(result.data);
        set((state) => ({
          isWalletConnected: false,
          walletProvider: null,
          currentUser: profile,
          authMethod: "google",
          authToken: result.token,
          members: (() => {
            const members = state.members.some((m) => m.id === profile.id)
              ? state.members.map((member) =>
                  member.id === profile.id ? profile : member
                )
              : [profile, ...state.members];
            writeCache("members", members);
            return members;
          })(),
        }));

        // Store token in localStorage for persistence
        if (result.token) {
          localStorage.setItem("auth_token", result.token);
        }

        return true;
      } else {
        alert(
          `❌ LOGIN FAILED\n\n${result.message || "Email is not registered in the system."}`
        );
        return false;
      }
    } catch (error) {
      console.error("[loginWithGoogle] Error:", error);
      alert("❌ AUTHENTICATION FAILED\n\nCannot connect to server. Please try again later.");
      return false;
    }
  },

  // Link Google account to existing wallet account
  linkGoogleAccount: async (googleUserInfo: GoogleUserInfo) => {
    try {
      const state = get();
      if (!state.walletAddress || !state.currentUser) {
        alert("Please login with wallet first before linking Google account.");
        return false;
      }

      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[linkGoogleAccount] Linking Google to wallet:", state.walletAddress);

      const res = await fetch(`${base}/api/auth/google/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": state.walletAddress,
        },
        credentials: "include",
        body: JSON.stringify({
          wallet_address: state.walletAddress,
          email: googleUserInfo.email,
          google_id: googleUserInfo.google_id,
        }),
      });

      const result = await res.json();
      console.log("[linkGoogleAccount] Result:", result);

      if (res.ok && result.success) {
        const updatedProfile = normalizeMember(result.data);
        // Update current user with new Google info
        set((state) => {
          const members = state.members.map((member) =>
            member.id === updatedProfile.id ? updatedProfile : member
          );
          writeCache("members", members);
          return {
            currentUser: updatedProfile,
            members,
          };
        });
        alert("✅ Account linked successfully!\n\nYou can now login with either Google or Wallet.");
        return true;
      } else {
        alert(`❌ Account linking failed\n\n${result.message || "An error occurred."}`);
        return false;
      }
    } catch (error) {
      console.error("[linkGoogleAccount] Error:", error);
      alert("❌ ACCOUNT LINKING FAILED\n\nCannot connect to server. Please try again later.");
      return false;
    }
  },

  // Check existing session on app load
  checkSession: async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const result = await res.json();
      console.log("[checkSession] Result:", result);

      if (result.success && result.authenticated && result.data) {
        const profile = normalizeMember(result.data);
        const sessionAuthMethod =
          profile.auth_provider === 'wallet' ? 'wallet' : 'google';
        set((state) => ({
          isWalletConnected: sessionAuthMethod === 'wallet',
          currentUser: profile,
          authMethod: sessionAuthMethod,
          authToken: token,
          members: (() => {
            const members = state.members.some((m) => m.id === profile.id)
              ? state.members.map((member) =>
                  member.id === profile.id ? profile : member
                )
              : [profile, ...state.members];
            writeCache("members", members);
            return members;
          })(),
        }));
      } else {
        // Invalid token, clear it
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("[checkSession] Error:", error);
      localStorage.removeItem("auth_token");
    }
  },

  // Logout - clear all auth state
  logout: () => {
    localStorage.removeItem("auth_token");

    // Also call backend logout
    const base = (import.meta as any).env.VITE_API_BASE_URL || "";
    fetch(`${base}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(console.error);

    set({
      isWalletConnected: false,
      walletAddress: null,
      walletProvider: null,
      currentUser: null,
      authMethod: null,
      authToken: null,
    });
  },

  addEvent: async (event) => {
    const state = get();

    if (!state.currentUser) {
      console.error("[addEvent] User not authenticated");
      alert("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      alert("Community accounts cannot create club events.");
      return;
    }

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";

      console.log("[addEvent] Sending to backend:", event);

      const res = await fetch(`${base}/api/events`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          time: event.time,
          type: event.type,
          location: event.location,
          attendees: event.attendees || 0,
          luma_link: event.luma_link,
        }),
      });

      console.log("[addEvent] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[addEvent] Success:", result);
        // Add to local state
        set((state) => {
          const events = [...state.events, result.data];
          writeCache("events", events);
          return { events };
        });
      } else {
        const error = await res.json();
        console.error("[addEvent] Failed:", error);
      }
    } catch (e) {
      console.error("Failed to add event", e);
      // Fallback to local state
      set((state) => ({ events: [...state.events, event] }));
    }
  },

  addBounty: async (bounty) => {
    const state = get();

    if (!state.currentUser) {
      console.error("[addBounty] User not authenticated");
      alert("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      alert("Community accounts cannot create bounties.");
      return;
    }

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";

      console.log("[addBounty] Sending to backend:", bounty);

      const res = await fetch(`${base}/api/work/bounties`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify({
          title: bounty.title,
          reward: bounty.reward,
          difficulty: bounty.difficulty,
          tags: bounty.tags,
          status: bounty.status || "Open",
          submitLink: bounty.submitLink || null,
        }),
      });

      console.log("[addBounty] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[addBounty] Success:", result);
        const nextBounty = normalizeBounty(result.data);
        set((state) => {
          const bounties = [...state.bounties, nextBounty];
          writeCache("bounties", bounties);
          return { bounties };
        });
      } else {
        const error = await res.json();
        console.error("[addBounty] Failed:", error);
      }
    } catch (e) {
      console.error("Failed to add bounty", e);
      set((state) => ({ bounties: [...state.bounties, bounty] }));
    }
  },

  addRepo: async (repo) => {
    const state = get();

    if (!state.currentUser) {
      console.error("[addRepo] User not authenticated");
      alert("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      alert("Community accounts cannot create repositories.");
      return;
    }

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";

      console.log("[addRepo] Sending to backend:", repo);

      const res = await fetch(`${base}/api/work/repos`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify({
          name: repo.name,
          description: repo.description || "",
          language: repo.language || "",
          url: repo.repoLink || null,
          stars: repo.stars || 0,
          forks: repo.forks || 0,
        }),
      });

      console.log("[addRepo] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[addRepo] Success:", result);
        const nextRepo = normalizeRepo(result.data);
        set((state) => {
          const repos = [...state.repos, nextRepo];
          writeCache("repos", repos);
          return { repos };
        });
      } else {
        const error = await res.json();
        console.error("[addRepo] Failed:", error);
      }
    } catch (e) {
      console.error("Failed to add repo", e);
      set((state) => ({ repos: [...state.repos, repo] }));
    }
  },
  addResource: async (resource) => {
    const state = get();

    if (!state.currentUser) {
      console.error("[addResource] User not authenticated");
      alert("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      alert("Community accounts cannot create resources.");
      return;
    }

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";

      console.log("[addResource] Sending to backend:", resource);

      const res = await fetch(`${base}/api/resources`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify({
          name: resource.name,
          type: resource.type,
          url: resource.url,
          category: resource.category,
        }),
      });

      console.log("[addResource] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[addResource] Success:", result);
        // Add to local state
        set((state) => {
          const resources = [...state.resources, result.data];
          writeCache("resources", resources);
          return { resources };
        });
      } else {
        const error = await res.json();
        console.error("[addResource] Failed:", error);
      }
    } catch (e) {
      console.error("Failed to add resource", e);
      // Fallback to local state
      set((state) => ({ resources: [...state.resources, resource] }));
    }
  },
  addProject: async (project) => {
    const state = get();

    if (!state.currentUser) {
      console.error("[addProject] User not authenticated");
      alert("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      alert("Community accounts cannot create projects.");
      return;
    }

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";

      console.log("[addProject] Sending to backend:", project);

      const res = await fetch(`${base}/api/projects`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          category: project.category,
          builders: project.builders,
          link: project.link,
          repo_link: project.repoLink,
        }),
      });

      console.log("[addProject] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[addProject] Success:", result);
        // Add to local state
        set((state) => {
          const projects = [...state.projects, result.data];
          writeCache("projects", projects);
          return { projects };
        });
      } else {
        const error = await res.json();
        console.error("[addProject] Failed:", error);
      }
    } catch (e) {
      console.error("Failed to add project", e);
      // Fallback to local state
      set((state) => ({ projects: [...state.projects, project] }));
    }
  },

  // Submit finance request to backend
  submitFinanceRequest: async (req) => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const state = get();

      if (!state.currentUser) {
        console.error("[submitFinanceRequest] User not authenticated");
        throw new Error("User not authenticated");
      }

      if (!canManageClubData(state)) {
        throw new Error("Community accounts cannot access finance.");
      }

      console.log("[submitFinanceRequest] Submitting:", {
        amount: req.amount,
        reason: req.reason,
        date: req.date,
        hasImage: !!req.billImage,
        imageSize: req.billImage?.length,
      });

      const res = await fetch(`${base}/api/finance/request`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify({
          amount: req.amount,
          reason: req.reason,
          date: req.date,
          bill_image: req.billImage,
        }),
      });

      console.log("[submitFinanceRequest] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[submitFinanceRequest] Success:", result);
        if (result && result.success && result.data) {
          // Add to local state
          set((state) => ({
            financeRequests: [...state.financeRequests, result.data],
          }));
        }
      } else {
        const error = await res
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("[submitFinanceRequest] Failed:", error);
        throw new Error(error.message || "Failed to submit finance request");
      }
    } catch (e) {
      console.error("[submitFinanceRequest] Error:", e);
      throw e;
    }
  },

  // Fetch pending requests from backend
  fetchPendingRequests: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const state = get();

      if (!state.currentUser) {
        return;
      }

      if (!canManageClubData(state)) {
        set({ financeRequests: [] });
        return;
      }

      // Admin roles can see all pending requests
      const adminRoles = ["President", "Vice-President", "Tech-Lead"];
      const isAdmin = adminRoles.includes(state.currentUser.role || "");

      // Use appropriate endpoint based on role
      const endpoint = isAdmin
        ? "/api/finance/pending"
        : "/api/finance/my-requests";

      const res = await fetch(`${base}${endpoint}`, {
        headers: getAuthHeaders(state),
      });

      if (res.ok) {
        const result = await res.json();
        if (result && result.success && result.data) {
          // For non-admin, filter to only show pending requests
          const rawRequests = isAdmin
            ? result.data
            : result.data.filter((r: any) => r.status === "pending");

          // Normalize snake_case to camelCase
          const pendingRequests = rawRequests.map((r: any) => ({
            id: r.id,
            amount: r.amount,
            reason: r.reason,
            date: r.date,
            billImage: r.bill_image || r.billImage,
            status: r.status,
            requesterName: r.requester_name || r.requesterName,
            requesterId: r.requester_id || r.requesterId,
          }));

          console.log(
            "[fetchPendingRequests] Normalized requests:",
            pendingRequests
          );
          set({ financeRequests: pendingRequests });
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

      if (!state.currentUser) {
        console.error("User not authenticated");
        return;
      }

      const res = await fetch(`${base}/api/finance/approve/${id}`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
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

      if (!state.currentUser) {
        console.error("User not authenticated");
        return;
      }

      const res = await fetch(`${base}/api/finance/reject/${id}`, {
        method: "POST",
        headers: getAuthHeaders(state, true),
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

  updateCurrentUser: async (updates) => {
    const state = get();

    if (!state.currentUser) {
      console.error("[updateCurrentUser] No current user");
      return;
    }

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";

      console.log(
        "[updateCurrentUser] Updating user:",
        state.currentUser.id,
        updates
      );

      const res = await fetch(`${base}/api/members/${state.currentUser.id}`, {
        method: "PUT",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify(updates),
      });

      console.log("[updateCurrentUser] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("[updateCurrentUser] Success:", result);

        const updatedUser = normalizeMember({
          ...state.currentUser,
          ...result.data,
          ...updates,
        });

        // Update members list
        const updatedMembers = state.members.map((m) =>
          m.id === updatedUser.id ? updatedUser : m
        );

        set({
          currentUser: updatedUser,
          members: updatedMembers,
        });
        writeCache("members", updatedMembers);
      } else {
        const error = await res.json();
        console.error("[updateCurrentUser] Failed:", error);
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("[updateCurrentUser] Error:", err);
      alert("Failed to update profile");
    }
  },
}));
