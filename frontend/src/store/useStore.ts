import toast from "react-hot-toast";
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
  GoogleCredential,
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
import {
  clearPendingAuthAnnouncement,
  markPendingAuthAnnouncement,
} from "../lib/authUi";

export type LocalDevRole = "admin" | "member" | "community";
export type BootstrapStatus = "idle" | "loading" | "slow" | "ready" | "error";

interface AppState {
  /** Profile wallet address mirror (not an active connection). */
  walletAddress: string | null;
  currentUser: Member | null; // The logged-in user's profile
  authMethod: AuthMethod | null; // 'google' or local dev auth
  authToken: string | null; // JWT after Google or local login
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;

  loginWithGoogle: (
    credential: GoogleCredential,
    intent?: AuthIntent,
  ) => Promise<boolean>;
  loginWithLocalAdmin: (role?: LocalDevRole) => Promise<boolean>;
  checkSession: () => Promise<void>;
  logout: () => void;
  fetchBootstrapData: () => Promise<void>;
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
const BOOTSTRAP_SLOW_MS = 2500;

const USE_DEMO_FALLBACK =
  (import.meta as any).env?.VITE_ENABLE_DEMO_FALLBACK === "true";

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

function normalizeProject(raw: any): Project {
  return {
    ...raw,
    repoLink: raw?.repoLink || raw?.repo_link || undefined,
    tech_stack:
      raw?.tech_stack && raw.tech_stack.length > 0
        ? raw.tech_stack
        : raw?.techStack || [],
  };
}

function getAuthHeaders(
  state: Pick<AppState, "walletAddress" | "authToken">,
  includeJson = false,
) {
  const headers: Record<string, string> = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  // Prefer JWT from Google / local login.
  const token =
    state.authToken ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("auth_token")
      : null);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function canManageClubData(state: Pick<AppState, "currentUser">) {
  return state.currentUser?.memberType === "member";
}

function upsertCurrentMember(state: Pick<AppState, "members">, profile: Member) {
  const members = state.members.some((member) => member.id === profile.id)
    ? state.members.map((member) =>
        member.id === profile.id ? profile : member,
      )
    : [profile, ...state.members];

  writeCache("members", members);
  return members;
}

function normalizeFinanceHistory(rows: any[]): FinanceRequest[] {
  return rows.map((r: any) => ({
    id: r.id,
    amount: r.amount,
    reason: r.reason,
    date: r.date,
    billImage: r.bill_image || r.billImage,
    status: r.status,
    requesterName: r.requester_name || r.requesterName,
    requesterId: r.requester_id || r.requesterId,
  }));
}

export const useStore = create<AppState>((set, get) => ({
  walletAddress: null,
  currentUser: null,
  authMethod: null,
  authToken: null,
  bootstrapStatus: "idle",
  bootstrapError: null,

  members:
    readCache<Member[]>("members", PUBLIC_CACHE_TTL_MS) ||
    (USE_DEMO_FALLBACK ? MEMBERS.map(normalizeMember) : []),
  events:
    readCache<Event[]>("events", PUBLIC_CACHE_TTL_MS) ||
    (USE_DEMO_FALLBACK ? EVENTS : []),
  bounties:
    readCache<Bounty[]>("bounties", PUBLIC_CACHE_TTL_MS) ||
    (USE_DEMO_FALLBACK ? BOUNTIES : []),
  repos:
    readCache<Repo[]>("repos", PUBLIC_CACHE_TTL_MS) ||
    (USE_DEMO_FALLBACK ? REPOS : []),
  resources:
    readCache<Resource[]>("resources", PUBLIC_CACHE_TTL_MS) ||
    (USE_DEMO_FALLBACK ? RESOURCES : []),
  projects:
    readCache<Project[]>("projects", PUBLIC_CACHE_TTL_MS) ||
    (USE_DEMO_FALLBACK ? PROJECTS : []),
  financeRequests: [],
  financeHistory:
    readCache<FinanceRequest[]>("financeHistory", PUBLIC_CACHE_TTL_MS) || [],

  fetchBootstrapData: async () => {
    const currentStatus = get().bootstrapStatus;
    if (currentStatus === "loading" || currentStatus === "slow") {
      return;
    }

    set({ bootstrapStatus: "loading", bootstrapError: null });
    const slowTimer = window.setTimeout(() => {
      if (get().bootstrapStatus === "loading") {
        set({ bootstrapStatus: "slow" });
      }
    }, BOOTSTRAP_SLOW_MS);

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/api/bootstrap`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Bootstrap request failed: ${res.status}`);
      }

      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Backend not found (no json response)");
      }

      const result = await res.json();
      const data = result?.data;

      if (!result?.success || !data) {
        throw new Error("Invalid bootstrap response");
      }

      const members = (data.members || []).map(normalizeMember);
      const financeHistory = normalizeFinanceHistory(data.financeHistory || []);
      const events = (data.events || []).map((e: any) => ({
        ...e,
        luma_link: e.luma_link || e.lumaLink || e.link || "",
      }));
      const projects = (data.projects || []).map(normalizeProject);
      const bounties = (data.bounties || []).map(normalizeBounty);
      const repos = (data.repos || []).map(normalizeRepo);
      const resources = data.resources || [];

      set((state) => ({
        members,
        financeHistory,
        events,
        projects,
        resources,
        bounties,
        repos,
        currentUser: state.currentUser
          ? members.find((member) => member.id === state.currentUser?.id) ||
            state.currentUser
          : state.currentUser,
      }));

      writeCache("members", members);
      writeCache("financeHistory", financeHistory);
      writeCache("events", events);
      writeCache("projects", projects);
      writeCache("resources", resources);
      writeCache("bounties", bounties);
      writeCache("repos", repos);
      set({ bootstrapStatus: "ready", bootstrapError: null });
    } catch (e) {
      console.error("Failed to fetch bootstrap data", e);
      await Promise.allSettled([
        get().fetchMembers(),
        get().fetchFinanceHistory(),
        get().fetchEvents(),
        get().fetchProjects(),
        get().fetchResources(),
        get().fetchBounties(),
        get().fetchRepos(),
      ]);

      const fallbackState = get();
      const hasFallbackData = [
        fallbackState.members,
        fallbackState.events,
        fallbackState.projects,
        fallbackState.resources,
        fallbackState.bounties,
        fallbackState.repos,
      ].some((items) => items.length > 0);

      set({
        bootstrapStatus: hasFallbackData ? "ready" : "error",
        bootstrapError: hasFallbackData
          ? null
          : e instanceof Error
            ? e.message
            : "Could not refresh live data.",
      });
    } finally {
      window.clearTimeout(slowTimer);
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[fetchMembers] Result:", result);

        if (result && result.success && result.data) {
          const members = result.data.map(normalizeMember);
          console.log("[fetchMembers] Setting members:", members.length);
          set((state) => ({
            members,
            currentUser: state.currentUser
              ? members.find((member) => member.id === state.currentUser?.id) ||
                state.currentUser
              : state.currentUser,
          }));
          writeCache("members", members);
        }
      } else {
        console.error(
          "[fetchMembers] Response not OK:",
          res.status,
          res.statusText,
        );
      }
    } catch (e) {
      console.error("Failed to fetch members from backend", e);
      if (USE_DEMO_FALLBACK) {
        set((state) => {
          const members = MEMBERS.map(normalizeMember);
          return {
            members,
            currentUser: state.currentUser
              ? members.find((member) => member.id === state.currentUser?.id) ||
                state.currentUser
              : state.currentUser,
          };
        });
      }
    }
  },

  // Fetch finance history from backend
  fetchFinanceHistory: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/api/finance-history`);
      if (res.ok) {
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[fetchFinanceHistory] Raw result:", result);
        if (result && result.success && result.data) {
          const history = normalizeFinanceHistory(result.data);
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[fetchEvents] Raw result:", result);
        if (result && result.success && result.data) {
          // Normalize snake_case to camelCase
          const events = result.data.map((e: any) => ({
            ...e,
            luma_link: e.luma_link || e.lumaLink || e.link || "",
          }));
          console.log("[fetchEvents] Normalized events:", events);
          set({ events });
          writeCache("events", events);
        }
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
      if (USE_DEMO_FALLBACK) {
        set({ events: EVENTS });
      }
    }
  },

  // Fetch projects from backend
  fetchProjects: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchProjects] Fetching from:", `${base}/api/projects`);
      const res = await fetch(`${base}/api/projects`);
      if (res.ok) {
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[fetchProjects] Result:", result);
        if (result && result.success && result.data) {
          const projects = result.data.map(normalizeProject);
          set({ projects });
          writeCache("projects", projects);
        }
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
      if (USE_DEMO_FALLBACK) {
        set({ projects: PROJECTS });
      }
    }
  },

  // Fetch resources from backend
  fetchResources: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchResources] Fetching from:", `${base}/api/resources`);
      const res = await fetch(`${base}/api/resources`);
      if (res.ok) {
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[fetchResources] Result:", result);
        if (result && result.success && result.data) {
          set({ resources: result.data });
          writeCache("resources", result.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch resources", e);
      if (USE_DEMO_FALLBACK) {
        set({ resources: RESOURCES });
      }
    }
  },

  // Fetch bounties from backend
  fetchBounties: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log(
        "[fetchBounties] Fetching from:",
        `${base}/api/work/bounties`,
      );
      const res = await fetch(`${base}/api/work/bounties`);
      if (res.ok) {
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
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
      if (USE_DEMO_FALLBACK) {
        set({ bounties: BOUNTIES });
      }
    }
  },

  // Fetch repos from backend
  fetchRepos: async () => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[fetchRepos] Fetching from:", `${base}/api/work/repos`);
      const res = await fetch(`${base}/api/work/repos`);
      if (res.ok) {
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
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
      if (USE_DEMO_FALLBACK) {
        set({ repos: REPOS });
      }
    }
  },

  // Login with Google � send ID token; server verifies and derives identity
  loginWithGoogle: async (
    credential: GoogleCredential,
    intent: AuthIntent = "login",
  ) => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      console.log("[loginWithGoogle] Attempting login with Google credential");

      const res = await fetch(`${base}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          credential,
          intent,
        }),
      });

      const result = await res.json();
      console.log("[loginWithGoogle] Result:", result);

      if (res.ok && result.success) {
        const profile = normalizeMember(result.data);
        set((state) => ({
          walletAddress: profile.wallet_address || null,
          currentUser: profile,
          authMethod: "google",
          authToken: result.token,
          members: upsertCurrentMember(state, profile),
        }));

        // Store token in localStorage for persistence
        if (result.token) {
          localStorage.setItem("auth_token", result.token);
        }

        markPendingAuthAnnouncement("google");
        return true;
      } else {
        toast(
          `? LOGIN FAILED\n\n${result.message || "Email is not registered in the system."}`,
        );
        return false;
      }
    } catch (error) {
      console.error("[loginWithGoogle] Error:", error);
      toast.error(
        "? AUTHENTICATION FAILED\n\nCannot connect to server. Please try again later.",
      );
      return false;
    }
  },

  loginWithLocalAdmin: async (role: LocalDevRole = "admin") => {
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/api/auth/dev-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        const profile = normalizeMember(result.data);
        set((state) => ({
          walletAddress: profile.wallet_address || null,
          currentUser: profile,
          authMethod: "local",
          authToken: result.token,
          members: upsertCurrentMember(state, profile),
        }));

        if (result.token) {
          localStorage.setItem("auth_token", result.token);
        }

        markPendingAuthAnnouncement("local");
        return true;
      }

      toast(
        `? LOCAL LOGIN FAILED\n\n${result.message || "Local dev auth is not available."}`,
      );
      return false;
    } catch (error) {
      console.error("[loginWithLocalAdmin] Error:", error);
      toast.error(
        "? LOCAL LOGIN FAILED\n\nCannot reach the local backend dev auth endpoint.",
      );
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
        const sessionAuthMethod: AuthMethod =
          result.authMethod === "local" ? "local" : "google";
        set((state) => ({
          walletAddress: profile.wallet_address || null,
          currentUser: profile,
          authMethod: sessionAuthMethod,
          authToken: token,
          members: upsertCurrentMember(state, profile),
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
    clearPendingAuthAnnouncement();
    localStorage.removeItem("auth_token");

    // Also call backend logout
    const base = (import.meta as any).env.VITE_API_BASE_URL || "";
    fetch(`${base}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(console.error);

    set({
      walletAddress: null,
      currentUser: null,
      authMethod: null,
      authToken: null,
    });
  },
  addEvent: async (event) => {
    const state = get();

    if (!state.currentUser) {
      console.error("[addEvent] User not authenticated");
      toast.error("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      toast.error("Community accounts cannot create club events.");
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
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
      toast.error("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      toast.error("Community accounts cannot create bounties.");
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
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
      toast.error("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      toast.error("Community accounts cannot create repositories.");
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
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
      toast.error("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      toast.error("Community accounts cannot create resources.");
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
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
      toast.error("Please sign in first!");
      return;
    }

    if (!canManageClubData(state)) {
      toast.error("Community accounts cannot create projects.");
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[addProject] Success:", result);
        const nextProject = normalizeProject(result.data);
        // Add to local state
        set((state) => {
          const projects = [...state.projects, nextProject];
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
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[submitFinanceRequest] Success:", result);
        if (result && result.success && result.data) {
          const submittedRequest = normalizeFinanceHistory([result.data])[0];
          set((state) => ({
            financeRequests: [submittedRequest, ...state.financeRequests],
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

      const canModerateFinance =
        state.currentUser.memberType === "member" &&
        ["President", "Vice-President"].includes(state.currentUser.role || "");

      // Use appropriate endpoint based on role
      const endpoint = canModerateFinance
        ? "/api/finance/pending"
        : "/api/finance/my-requests";

      const res = await fetch(`${base}${endpoint}`, {
        headers: getAuthHeaders(state),
      });

      if (res.ok) {
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        if (result && result.success && result.data) {
          // For non-admin, filter to only show pending requests
          const rawRequests = canModerateFinance
            ? result.data
            : result.data.filter((r: any) => r.status === "pending");

          const pendingRequests = normalizeFinanceHistory(rawRequests);

          console.log(
            "[fetchPendingRequests] Normalized requests:",
            pendingRequests,
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
        updates,
      );

      const res = await fetch(`${base}/api/members/${state.currentUser.id}`, {
        method: "PUT",
        headers: getAuthHeaders(state, true),
        body: JSON.stringify(updates),
      });

      console.log("[updateCurrentUser] Response status:", res.status);

      if (res.ok) {
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Backend not found (no json response)");
        }
        const result = await res.json();
        console.log("[updateCurrentUser] Success:", result);

        const updatedUser = normalizeMember({
          ...state.currentUser,
          ...result.data,
          ...updates,
        });

        // Update members list
        const updatedMembers = state.members.map((m) =>
          m.id === updatedUser.id ? updatedUser : m,
        );

        set({
          currentUser: updatedUser,
          walletAddress: updatedUser.wallet_address || null,
          members: updatedMembers,
        });
        writeCache("members", updatedMembers);
      } else {
        const error = await res.json();
        console.error("[updateCurrentUser] Failed:", error);
        toast.error("Failed to update profile");
      }
    } catch (err) {
      console.error("[updateCurrentUser] Error:", err);
      toast.error("Failed to update profile");
    }
  },
}));
