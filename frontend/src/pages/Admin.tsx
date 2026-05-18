import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Boxes,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import { ActionButton } from "@/components/ui/Primitives";
import {
  AdminEmptyState,
  AdminField,
  AdminHero,
  AdminListButton,
  AdminMetricCard,
  AdminNotice,
  AdminPageSection,
  AdminPanel,
  AdminTabs,
  AdminToggleRow,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/AdminConsole";
import { useStore } from "@/store/useStore";
import type { AdminApiKey, Member } from "@/types";

type AdminTab = "members" | "content" | "finance" | "keys";
type ContentEntity = "events" | "projects" | "resources" | "bounties" | "repos";

type EditableUser = {
  id: string;
  name: string;
  email: string;
  wallet_address: string;
  member_type: "member" | "community";
  role: string;
  academy_access: boolean;
  is_active: boolean;
};

type ContentRow = Record<string, any>;

type ContentOverview = {
  events: ContentRow[];
  projects: ContentRow[];
  resources: ContentRow[];
  bounties: ContentRow[];
  repos: ContentRow[];
  finance_requests: ContentRow[];
  finance_history: ContentRow[];
};

type ContentFormState = Record<string, string>;

type AgentKeyDraft = {
  name: string;
  scopesText: string;
  is_active: boolean;
};

const EMPTY_CONTENT_DATA: ContentOverview = {
  events: [],
  projects: [],
  resources: [],
  bounties: [],
  repos: [],
  finance_requests: [],
  finance_history: [],
};

const EMPTY_USER: EditableUser = {
  id: "",
  name: "",
  email: "",
  wallet_address: "",
  member_type: "community",
  role: "Community",
  academy_access: true,
  is_active: true,
};

const ROLE_OPTIONS = [
  "President",
  "Vice-President",
  "Tech-Lead",
  "Media-Lead",
  "Member",
  "Community",
] as const;

const CONTENT_LABELS: Record<ContentEntity, string> = {
  events: "Events",
  projects: "Projects",
  resources: "Resources",
  bounties: "Bounties",
  repos: "Repos",
};

const CONTENT_STATUS_OPTIONS: Record<ContentEntity, string[]> = {
  events: ["Draft", "Published", "Archived"],
  projects: ["Draft", "Published", "Archived"],
  resources: ["Draft", "Published", "Archived"],
  bounties: ["Open", "In Progress", "Completed", "Closed"],
  repos: ["Draft", "Published", "Archived"],
};

function buildAuthHeaders(token: string | null, walletAddress: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers["x-wallet-address"] = walletAddress;
  }

  return headers;
}

function getApiBase() {
  return (import.meta as any).env.VITE_API_BASE_URL || "";
}

function memberToDraft(user: Member): EditableUser {
  const memberType =
    user.memberType === "community" || user.member_type === "community"
      ? "community"
      : "member";

  return {
    id: user.id,
    name: user.name,
    email: user.email || "",
    wallet_address: user.wallet_address || "",
    member_type: memberType,
    role: memberType === "community" ? "Community" : user.role || "Member",
    academy_access:
      user.academyAccess !== false && user.academy_access !== false,
    is_active: user.is_active !== false,
  };
}

function parseCsvList(value: string) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "No activity";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: string | number | undefined) {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) {
    return String(value || "0");
  }

  return numeric.toLocaleString("vi-VN");
}

function entityPath(entity: ContentEntity) {
  switch (entity) {
    case "events":
      return "/api/events";
    case "projects":
      return "/api/projects";
    case "resources":
      return "/api/resources";
    case "bounties":
      return "/api/work/bounties";
    case "repos":
      return "/api/work/repos";
  }
}

function emptyContentForm(entity: ContentEntity): ContentFormState {
  switch (entity) {
    case "events":
      return {
        title: "",
        date: "",
        time: "",
        type: "Workshop",
        location: "",
        luma_link: "",
        attendees: "0",
        status: "Published",
      };
    case "projects":
      return {
        name: "",
        description: "",
        category: "",
        builders: "",
        link: "",
        repo_link: "",
        image_url: "",
        status: "Published",
      };
    case "resources":
      return {
        name: "",
        type: "Link",
        url: "",
        size: "",
        category: "Learning",
        status: "Published",
      };
    case "bounties":
      return {
        title: "",
        description: "",
        reward: "",
        difficulty: "Medium",
        tags: "",
        submit_link: "",
        status: "Open",
      };
    case "repos":
      return {
        name: "",
        description: "",
        language: "",
        url: "",
        stars: "0",
        forks: "0",
        status: "Published",
      };
  }
}

function rowToContentForm(entity: ContentEntity, row: ContentRow): ContentFormState {
  switch (entity) {
    case "events":
      return {
        title: String(row.title || ""),
        date: String(row.date || ""),
        time: String(row.time || ""),
        type: String(row.type || "Workshop"),
        location: String(row.location || ""),
        luma_link: String(row.luma_link || ""),
        attendees: String(row.attendees ?? 0),
        status: String(row.status || "Published"),
      };
    case "projects":
      return {
        name: String(row.name || ""),
        description: String(row.description || ""),
        category: String(row.category || ""),
        builders: Array.isArray(row.builders) ? row.builders.join(", ") : "",
        link: String(row.link || ""),
        repo_link: String(row.repo_link || row.repoLink || ""),
        image_url: String(row.image_url || ""),
        status: String(row.status || "Published"),
      };
    case "resources":
      return {
        name: String(row.name || ""),
        type: String(row.type || "Link"),
        url: String(row.url || ""),
        size: String(row.size || ""),
        category: String(row.category || "Learning"),
        status: String(row.status || "Published"),
      };
    case "bounties":
      return {
        title: String(row.title || ""),
        description: String(row.description || ""),
        reward: String(row.reward || ""),
        difficulty: String(row.difficulty || "Medium"),
        tags: Array.isArray(row.tags) ? row.tags.join(", ") : "",
        submit_link: String(row.submit_link || row.submitLink || ""),
        status: String(row.status || "Open"),
      };
    case "repos":
      return {
        name: String(row.name || ""),
        description: String(row.description || ""),
        language: String(row.language || ""),
        url: String(row.url || ""),
        stars: String(row.stars ?? 0),
        forks: String(row.forks ?? 0),
        status: String(row.status || "Published"),
      };
  }
}

function contentFormToPayload(entity: ContentEntity, form: ContentFormState) {
  switch (entity) {
    case "events":
      return {
        title: form.title.trim(),
        date: form.date.trim(),
        time: form.time.trim(),
        type: form.type.trim(),
        location: form.location.trim(),
        luma_link: form.luma_link.trim(),
        attendees: Number(form.attendees || 0),
        status: form.status,
      };
    case "projects":
      return {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        builders: parseCsvList(form.builders),
        link: form.link.trim(),
        repo_link: form.repo_link.trim(),
        image_url: form.image_url.trim(),
        status: form.status,
      };
    case "resources":
      return {
        name: form.name.trim(),
        type: form.type.trim(),
        url: form.url.trim(),
        size: form.size.trim(),
        category: form.category.trim(),
        status: form.status,
      };
    case "bounties":
      return {
        title: form.title.trim(),
        description: form.description.trim(),
        reward: form.reward.trim(),
        difficulty: form.difficulty.trim(),
        tags: parseCsvList(form.tags),
        submitLink: form.submit_link.trim(),
        status: form.status,
      };
    case "repos":
      return {
        name: form.name.trim(),
        description: form.description.trim(),
        language: form.language.trim(),
        url: form.url.trim(),
        stars: Number(form.stars || 0),
        forks: Number(form.forks || 0),
        status: form.status,
      };
  }
}

function getContentItems(
  data: ContentOverview,
  entity: ContentEntity,
): ContentRow[] {
  return data[entity] || [];
}

function getContentTitle(entity: ContentEntity, row: ContentRow) {
  switch (entity) {
    case "events":
      return row.title || "Untitled event";
    case "projects":
      return row.name || "Untitled project";
    case "resources":
      return row.name || "Untitled resource";
    case "bounties":
      return row.title || "Untitled bounty";
    case "repos":
      return row.name || "Untitled repo";
  }
}

function getContentMeta(entity: ContentEntity, row: ContentRow) {
  switch (entity) {
    case "events":
      return `${row.date || "No date"} • ${row.type || "Workshop"} • ${row.location || "No location"}`;
    case "projects":
      return `${row.category || "General"} • ${(row.builders || []).length || 0} builders`;
    case "resources":
      return `${row.category || "Learning"} • ${row.type || "Link"}`;
    case "bounties":
      return `${row.difficulty || "Medium"} • ${row.reward || "No reward"}`;
    case "repos":
      return `${row.language || "Unknown"} • ${Number(row.stars || 0)} stars`;
  }
}

function getFinanceRequesterName(row: ContentRow) {
  return row.requester_name || row.requesterName || row.requesterId || "Unknown";
}

function getFinanceDate(row: ContentRow) {
  return row.date || row.created_at || row.updated_at || "";
}

export function Admin() {
  const { authToken, walletAddress, fetchMembers } = useStore();
  const headers = useMemo(
    () => buildAuthHeaders(authToken, walletAddress),
    [authToken, walletAddress],
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>("members");
  const [contentEntity, setContentEntity] = useState<ContentEntity>("events");

  const [users, setUsers] = useState<Member[]>([]);
  const [contentData, setContentData] =
    useState<ContentOverview>(EMPTY_CONTENT_DATA);
  const [agentKeys, setAgentKeys] = useState<AdminApiKey[]>([]);

  const [memberQuery, setMemberQuery] = useState("");
  const [contentQuery, setContentQuery] = useState("");
  const [selectedFinanceId, setSelectedFinanceId] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<EditableUser>(EMPTY_USER);
  const [creatingMember, setCreatingMember] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberDeleting, setMemberDeleting] = useState(false);

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState<ContentFormState>(
    emptyContentForm("events"),
  );
  const [creatingContent, setCreatingContent] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentDeleting, setContentDeleting] = useState(false);

  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState<AgentKeyDraft>({
    name: "",
    scopesText: "*",
    is_active: true,
  });
  const [creatingKey, setCreatingKey] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keyDeleting, setKeyDeleting] = useState(false);
  const [issuedKey, setIssuedKey] = useState("");

  const pendingFinance = contentData.finance_requests.filter(
    (row) => String(row.status || "").toLowerCase() === "pending",
  );

  const filteredUsers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const haystack = [
        user.id,
        user.name,
        user.role,
        user.email,
        ...(user.skills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [memberQuery, users]);

  const contentItems = useMemo(
    () => getContentItems(contentData, contentEntity),
    [contentData, contentEntity],
  );

  const filteredContentItems = useMemo(() => {
    const query = contentQuery.trim().toLowerCase();
    if (!query) {
      return contentItems;
    }

    return contentItems.filter((item) => {
      const haystack = JSON.stringify(item).toLowerCase();
      return haystack.includes(query);
    });
  }, [contentItems, contentQuery]);

  const selectedFinance = useMemo(() => {
    const combined = [
      ...contentData.finance_requests,
      ...contentData.finance_history,
    ];
    return combined.find((row) => row.id === selectedFinanceId) || null;
  }, [contentData.finance_history, contentData.finance_requests, selectedFinanceId]);

  async function loadData(nextMode: "initial" | "refresh" = "initial") {
    const base = getApiBase();

    if (nextMode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [usersRes, overviewRes, keysRes] = await Promise.all([
        fetch(`${base}/api/members/admin/list`, { headers }),
        fetch(`${base}/api/admin/overview`, { headers }),
        fetch(`${base}/api/admin/agent-keys`, { headers }),
      ]);

      const [usersJson, overviewJson, keysJson] = await Promise.all([
        usersRes.json(),
        overviewRes.json(),
        keysRes.json(),
      ]);

      if (!usersRes.ok) {
        throw new Error(usersJson?.message || "Failed to load members.");
      }
      if (!overviewRes.ok) {
        throw new Error(overviewJson?.message || "Failed to load admin overview.");
      }
      if (!keysRes.ok) {
        throw new Error(keysJson?.message || "Failed to load agent keys.");
      }

      setUsers(usersJson.data || []);
      setContentData({
        ...EMPTY_CONTENT_DATA,
        ...(overviewJson.data || {}),
      });
      setAgentKeys(keysJson.data || []);

      setSelectedFinanceId((current) => {
        const financeRows = [
          ...(overviewJson.data?.finance_requests || []),
          ...(overviewJson.data?.finance_history || []),
        ];
        if (current && financeRows.some((row: ContentRow) => row.id === current)) {
          return current;
        }
        return financeRows[0]?.id || null;
      });
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData("initial");
  }, [headers]);

  useEffect(() => {
    if (creatingMember) {
      return;
    }

    const fallback = users[0] || null;
    const selected =
      users.find((user) => user.id === selectedMemberId) || fallback;

    if (!selected) {
      setSelectedMemberId(null);
      setMemberDraft(EMPTY_USER);
      return;
    }

    if (selected.id !== selectedMemberId) {
      setSelectedMemberId(selected.id);
    }

    setMemberDraft(memberToDraft(selected));
  }, [creatingMember, selectedMemberId, users]);

  useEffect(() => {
    if (creatingContent) {
      return;
    }

    const fallback = contentItems[0] || null;
    const selected =
      contentItems.find((item) => item.id === selectedContentId) || fallback;

    if (!selected) {
      setSelectedContentId(null);
      setContentDraft(emptyContentForm(contentEntity));
      return;
    }

    if (selected.id !== selectedContentId) {
      setSelectedContentId(selected.id);
    }

    setContentDraft(rowToContentForm(contentEntity, selected));
  }, [contentEntity, contentItems, creatingContent, selectedContentId]);

  useEffect(() => {
    if (creatingKey) {
      return;
    }

    const fallback = agentKeys[0] || null;
    const selected =
      agentKeys.find((row) => row.id === selectedKeyId) || fallback;

    if (!selected) {
      setSelectedKeyId(null);
      setKeyDraft({ name: "", scopesText: "*", is_active: true });
      return;
    }

    if (selected.id !== selectedKeyId) {
      setSelectedKeyId(selected.id);
    }

    setKeyDraft({
      name: selected.name || "",
      scopesText: (selected.scopes || ["*"]).join(", "),
      is_active: selected.is_active !== false,
    });
  }, [agentKeys, creatingKey, selectedKeyId]);

  useEffect(() => {
    setCreatingContent(false);
    setContentQuery("");
    setSelectedContentId(null);
    setContentDraft(emptyContentForm(contentEntity));
  }, [contentEntity]);

  function startCreateMember() {
    setCreatingMember(true);
    setSelectedMemberId(null);
    setMemberDraft(EMPTY_USER);
  }

  function startCreateContent() {
    setCreatingContent(true);
    setSelectedContentId(null);
    setContentDraft(emptyContentForm(contentEntity));
  }

  function startCreateKey() {
    setCreatingKey(true);
    setSelectedKeyId(null);
    setKeyDraft({
      name: "",
      scopesText: "*",
      is_active: true,
    });
  }

  async function saveMember() {
    const base = getApiBase();
    setMemberSaving(true);
    setError("");
    setNotice("");

    try {
      const endpoint = creatingMember
        ? `${base}/api/members/admin/users`
        : `${base}/api/members/admin/users/${selectedMemberId}`;
      const method = creatingMember ? "POST" : "PATCH";

      const payload = {
        ...memberDraft,
        id: memberDraft.id.trim() || undefined,
        name: memberDraft.name.trim(),
        email: memberDraft.email.trim(),
        wallet_address: memberDraft.wallet_address.trim(),
      };

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to save member.");
      }

      setNotice(
        creatingMember
          ? "Member created successfully."
          : "Member updated successfully.",
      );
      toast.success(creatingMember ? "Member created" : "Member updated");
      setCreatingMember(false);
      await loadData("refresh");
      await fetchMembers();
      if (result?.data?.id) {
        setSelectedMemberId(result.data.id);
      }
    } catch (saveError: any) {
      const message = saveError?.message || "Failed to save member.";
      setError(message);
      toast.error(message);
    } finally {
      setMemberSaving(false);
    }
  }

  async function deleteMember() {
    if (!selectedMemberId || creatingMember) {
      return;
    }

    const base = getApiBase();
    setMemberDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${base}/api/members/admin/users/${selectedMemberId}`,
        {
          method: "DELETE",
          headers,
        },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete member.");
      }

      toast.success("Member deleted");
      setNotice("Member deleted successfully.");
      await loadData("refresh");
      await fetchMembers();
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete member.";
      setError(message);
      toast.error(message);
    } finally {
      setMemberDeleting(false);
    }
  }

  async function saveContent() {
    const base = getApiBase();
    setContentSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = contentFormToPayload(contentEntity, contentDraft);
      const endpoint = creatingContent
        ? `${base}${entityPath(contentEntity)}`
        : `${base}${entityPath(contentEntity)}/${selectedContentId}`;
      const method = creatingContent ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to save content.");
      }

      const savedRow = result?.data;
      const nextStatus = contentDraft.status;
      if (
        savedRow?.id &&
        nextStatus &&
        nextStatus !== (savedRow.status || "Published")
      ) {
        const statusResponse = await fetch(
          `${base}/api/admin/content/${contentEntity}/${savedRow.id}/status`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: nextStatus }),
          },
        );
        const statusResult = await statusResponse.json();
        if (!statusResponse.ok) {
          throw new Error(
            statusResult?.message || "Saved item, but failed to sync status.",
          );
        }
      }

      toast.success(
        creatingContent
          ? `${CONTENT_LABELS[contentEntity]} created`
          : `${CONTENT_LABELS[contentEntity]} updated`,
      );
      setNotice(
        creatingContent
          ? `${CONTENT_LABELS[contentEntity]} created successfully.`
          : `${CONTENT_LABELS[contentEntity]} updated successfully.`,
      );
      setCreatingContent(false);
      await loadData("refresh");
      if (savedRow?.id) {
        setSelectedContentId(savedRow.id);
      }
    } catch (saveError: any) {
      const message = saveError?.message || "Failed to save content.";
      setError(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  }

  async function deleteContent() {
    if (!selectedContentId || creatingContent) {
      return;
    }

    const base = getApiBase();
    setContentDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${base}/api/admin/content/${contentEntity}/${selectedContentId}`,
        {
          method: "DELETE",
          headers,
        },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete content.");
      }

      toast.success(`${CONTENT_LABELS[contentEntity]} deleted`);
      setNotice(`${CONTENT_LABELS[contentEntity]} deleted successfully.`);
      await loadData("refresh");
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete content.";
      setError(message);
      toast.error(message);
    } finally {
      setContentDeleting(false);
    }
  }

  async function handleFinanceAction(action: "approve" | "reject", id: string) {
    const base = getApiBase();
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${base}/api/finance/${action}/${id}`, {
        method: "POST",
        headers,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || `Failed to ${action} request.`);
      }

      toast.success(
        action === "approve" ? "Request approved" : "Request rejected",
      );
      setNotice(
        action === "approve"
          ? "Finance request approved successfully."
          : "Finance request rejected successfully.",
      );
      await loadData("refresh");
    } catch (actionError: any) {
      const message =
        actionError?.message || `Failed to ${action} finance request.`;
      setError(message);
      toast.error(message);
    }
  }

  async function saveKey() {
    const base = getApiBase();
    setKeySaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        name: keyDraft.name.trim(),
        scopes: parseCsvList(keyDraft.scopesText),
        is_active: keyDraft.is_active,
      };

      const endpoint = creatingKey
        ? `${base}/api/admin/agent-keys`
        : `${base}/api/admin/agent-keys/${selectedKeyId}`;
      const method = creatingKey ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to save agent key.");
      }

      if (result?.key) {
        setIssuedKey(result.key);
      }

      toast.success(creatingKey ? "Agent key created" : "Agent key updated");
      setNotice(
        creatingKey
          ? "Agent key created successfully."
          : "Agent key updated successfully.",
      );
      setCreatingKey(false);
      await loadData("refresh");
      if (result?.data?.id) {
        setSelectedKeyId(result.data.id);
      }
    } catch (saveError: any) {
      const message = saveError?.message || "Failed to save agent key.";
      setError(message);
      toast.error(message);
    } finally {
      setKeySaving(false);
    }
  }

  async function rotateKey() {
    if (!selectedKeyId || creatingKey) {
      return;
    }

    const base = getApiBase();
    setKeySaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${base}/api/admin/agent-keys/${selectedKeyId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ rotate: true }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to rotate key.");
      }

      if (result?.key) {
        setIssuedKey(result.key);
      }

      toast.success("Agent key rotated");
      setNotice("Agent key rotated successfully.");
      await loadData("refresh");
    } catch (rotateError: any) {
      const message = rotateError?.message || "Failed to rotate key.";
      setError(message);
      toast.error(message);
    } finally {
      setKeySaving(false);
    }
  }

  async function deleteKey() {
    if (!selectedKeyId || creatingKey) {
      return;
    }

    const base = getApiBase();
    setKeyDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${base}/api/admin/agent-keys/${selectedKeyId}`, {
        method: "DELETE",
        headers,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete key.");
      }

      toast.success("Agent key deleted");
      setNotice("Agent key deleted successfully.");
      setIssuedKey("");
      await loadData("refresh");
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete key.";
      setError(message);
      toast.error(message);
    } finally {
      setKeyDeleting(false);
    }
  }

  const adminTabs = [
    { id: "members" as const, label: "Members", count: users.length },
    {
      id: "content" as const,
      label: "Content",
      count:
        contentData.events.length +
        contentData.projects.length +
        contentData.resources.length +
        contentData.bounties.length +
        contentData.repos.length,
    },
    {
      id: "finance" as const,
      label: "Finance",
      count: pendingFinance.length,
    },
    { id: "keys" as const, label: "Agent Keys", count: agentKeys.length },
  ];

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <AdminEmptyState
          title="Loading admin control plane"
          description="Fetching members, content, finance requests, and agent keys."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10 md:space-y-10 md:py-14">
      <AdminHero
        eyebrow="Executive Control Plane"
        title="Admin"
        subtitle="Manage the live DSUC dataset across members, content, finance, and automation keys without dropping into raw tables."
        actions={
          <>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={() => void loadData("refresh")}
              disabled={refreshing}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {refreshing ? "Refreshing" : "Refresh"}
              </span>
            </ActionButton>
          </>
        }
        metrics={
          <>
            <AdminMetricCard
              label="Official + Community"
              value={users.length}
              meta={`${users.filter((user) => (user.memberType || user.member_type) === "member").length} official / ${users.filter((user) => (user.memberType || user.member_type) === "community").length} community`}
              icon={<Users className="h-5 w-5" />}
              tone="primary"
            />
            <AdminMetricCard
              label="Pending Finance"
              value={pendingFinance.length}
              meta={`${contentData.finance_history.length} history rows`}
              icon={<CreditCard className="h-5 w-5" />}
              tone="warning"
            />
            <AdminMetricCard
              label="Published Content"
              value={
                contentData.events.length +
                contentData.projects.length +
                contentData.resources.length +
                contentData.bounties.length +
                contentData.repos.length
              }
              meta="events, projects, resources, bounties, repos"
              icon={<Boxes className="h-5 w-5" />}
            />
            <AdminMetricCard
              label="Active Agent Keys"
              value={agentKeys.filter((row) => row.is_active !== false).length}
              meta={`${agentKeys.length} total keys`}
              icon={<ShieldCheck className="h-5 w-5" />}
              tone="accent"
            />
          </>
        }
      />

      {error ? <AdminNotice tone="error" message={error} /> : null}
      {notice ? <AdminNotice tone="success" message={notice} /> : null}

      <AdminTabs
        tabs={adminTabs}
        active={activeTab}
        onChange={(value) => setActiveTab(value as AdminTab)}
      />

      {activeTab === "members" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="User Directory"
              title="Members Database"
              description="Search the full member table, then open a row to edit identity, role, access, and active state."
              actions={
                <ActionButton type="button" variant="secondary" onClick={startCreateMember}>
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Member
                  </span>
                </ActionButton>
              }
            >
              <div className="space-y-4">
                <input
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Search by name, role, id, email, or skill"
                  className={adminInputClass}
                />

                <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <AdminListButton
                        key={user.id}
                        title={user.name}
                        meta={`${user.role || "Member"} • ${user.id}`}
                        active={!creatingMember && selectedMemberId === user.id}
                        onClick={() => {
                          setCreatingMember(false);
                          setSelectedMemberId(user.id);
                        }}
                        badges={
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                              {(user.memberType || user.member_type) === "community"
                                ? "Community"
                                : "Official"}
                            </span>
                            <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                              {user.is_active !== false ? "Active" : "Inactive"}
                            </span>
                            <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                              {user.streak || 0}d streak
                            </span>
                          </div>
                        }
                      />
                    ))
                  ) : (
                    <AdminEmptyState
                      title="No matching members"
                      description="Try a broader search or create a new member row."
                    />
                  )}
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow={creatingMember ? "Create Row" : "Edit Row"}
              title={creatingMember ? "New Member" : "Member Editor"}
              description="This editor controls the actual member record used by auth, routing, permissions, and profile visibility."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    type="button"
                    variant="primary"
                    onClick={() => void saveMember()}
                    disabled={memberSaving}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {memberSaving ? "Saving" : creatingMember ? "Create" : "Save"}
                    </span>
                  </ActionButton>
                  {!creatingMember ? (
                    <ActionButton
                      type="button"
                      variant="danger"
                      onClick={() => void deleteMember()}
                      disabled={memberDeleting}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        {memberDeleting ? "Deleting" : "Delete"}
                      </span>
                    </ActionButton>
                  ) : null}
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Member ID" hint="Leave blank to auto-generate">
                  <input
                    value={memberDraft.id}
                    onChange={(event) =>
                      setMemberDraft((current) => ({
                        ...current,
                        id: event.target.value,
                      }))
                    }
                    disabled={!creatingMember}
                    className={adminInputClass}
                  />
                </AdminField>
                <AdminField label="Role">
                  <select
                    value={memberDraft.role}
                    onChange={(event) =>
                      setMemberDraft((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    className={adminSelectClass}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="Name">
                  <input
                    value={memberDraft.name}
                    onChange={(event) =>
                      setMemberDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={adminInputClass}
                  />
                </AdminField>
                <AdminField label="Member Type">
                  <select
                    value={memberDraft.member_type}
                    onChange={(event) =>
                      setMemberDraft((current) => ({
                        ...current,
                        member_type: event.target.value as "member" | "community",
                        role:
                          event.target.value === "community"
                            ? "Community"
                            : current.role === "Community"
                              ? "Member"
                              : current.role,
                      }))
                    }
                    className={adminSelectClass}
                  >
                    <option value="member">Official</option>
                    <option value="community">Community</option>
                  </select>
                </AdminField>
                <AdminField label="Email">
                  <input
                    value={memberDraft.email}
                    onChange={(event) =>
                      setMemberDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={adminInputClass}
                  />
                </AdminField>
                <AdminField label="Wallet Address">
                  <input
                    value={memberDraft.wallet_address}
                    onChange={(event) =>
                      setMemberDraft((current) => ({
                        ...current,
                        wallet_address: event.target.value,
                      }))
                    }
                    className={adminInputClass}
                  />
                </AdminField>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AdminToggleRow
                  label="Academy Access"
                  description="Controls entry into member-only academy areas."
                  checked={memberDraft.academy_access}
                  onChange={(checked) =>
                    setMemberDraft((current) => ({
                      ...current,
                      academy_access: checked,
                    }))
                  }
                />
                <AdminToggleRow
                  label="Active Profile"
                  description="Inactive users disappear from public lists."
                  checked={memberDraft.is_active}
                  onChange={(checked) =>
                    setMemberDraft((current) => ({
                      ...current,
                      is_active: checked,
                    }))
                  }
                />
              </div>
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "content" ? (
        <AdminPageSection>
          <AdminTabs
            tabs={
              (Object.keys(CONTENT_LABELS) as ContentEntity[]).map((entity) => ({
                id: entity,
                label: CONTENT_LABELS[entity],
                count: getContentItems(contentData, entity).length,
              }))
            }
            active={contentEntity}
            onChange={(value) => setContentEntity(value as ContentEntity)}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Dataset Browser"
              title={`${CONTENT_LABELS[contentEntity]} Table`}
              description="Browse the live rows for this entity, then open a row to edit or create a new one."
              actions={
                <ActionButton type="button" variant="secondary" onClick={startCreateContent}>
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New {CONTENT_LABELS[contentEntity].slice(0, -1)}
                  </span>
                </ActionButton>
              }
            >
              <div className="space-y-4">
                <input
                  value={contentQuery}
                  onChange={(event) => setContentQuery(event.target.value)}
                  placeholder={`Search ${CONTENT_LABELS[contentEntity].toLowerCase()}`}
                  className={adminInputClass}
                />

                <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
                  {filteredContentItems.length > 0 ? (
                    filteredContentItems.map((row) => (
                      <AdminListButton
                        key={row.id}
                        title={getContentTitle(contentEntity, row)}
                        meta={getContentMeta(contentEntity, row)}
                        active={!creatingContent && selectedContentId === row.id}
                        onClick={() => {
                          setCreatingContent(false);
                          setSelectedContentId(row.id);
                        }}
                        badges={
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                              {row.status || "Published"}
                            </span>
                          </div>
                        }
                      />
                    ))
                  ) : (
                    <AdminEmptyState
                      title={`No ${CONTENT_LABELS[contentEntity].toLowerCase()} found`}
                      description="Create a new row or broaden the search query."
                    />
                  )}
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow={creatingContent ? "Create Row" : "Edit Row"}
              title={`${CONTENT_LABELS[contentEntity].slice(0, -1)} Editor`}
              description="This writes directly to the live table. Save content first, then the admin layer syncs its status if needed."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    type="button"
                    variant="primary"
                    onClick={() => void saveContent()}
                    disabled={contentSaving}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {contentSaving
                        ? "Saving"
                        : creatingContent
                          ? "Create"
                          : "Save"}
                    </span>
                  </ActionButton>
                  {!creatingContent ? (
                    <ActionButton
                      type="button"
                      variant="danger"
                      onClick={() => void deleteContent()}
                      disabled={contentDeleting}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        {contentDeleting ? "Deleting" : "Delete"}
                      </span>
                    </ActionButton>
                  ) : null}
                </div>
              }
            >
              {contentEntity === "events" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Title">
                    <input value={contentDraft.title || ""} onChange={(event) => setContentDraft((current) => ({ ...current, title: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Type">
                    <select value={contentDraft.type || "Workshop"} onChange={(event) => setContentDraft((current) => ({ ...current, type: event.target.value }))} className={adminSelectClass}>
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Social">Social</option>
                    </select>
                  </AdminField>
                  <AdminField label="Date">
                    <input type="date" value={contentDraft.date || ""} onChange={(event) => setContentDraft((current) => ({ ...current, date: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Time">
                    <input value={contentDraft.time || ""} onChange={(event) => setContentDraft((current) => ({ ...current, time: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <div className="md:col-span-2">
                    <AdminField label="Location">
                      <input value={contentDraft.location || ""} onChange={(event) => setContentDraft((current) => ({ ...current, location: event.target.value }))} className={adminInputClass} />
                    </AdminField>
                  </div>
                  <div className="md:col-span-2">
                    <AdminField label="Luma Link">
                      <input value={contentDraft.luma_link || ""} onChange={(event) => setContentDraft((current) => ({ ...current, luma_link: event.target.value }))} className={adminInputClass} />
                    </AdminField>
                  </div>
                  <AdminField label="Attendees">
                    <input value={contentDraft.attendees || "0"} onChange={(event) => setContentDraft((current) => ({ ...current, attendees: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Status">
                    <select value={contentDraft.status || "Published"} onChange={(event) => setContentDraft((current) => ({ ...current, status: event.target.value }))} className={adminSelectClass}>
                      {CONTENT_STATUS_OPTIONS.events.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </AdminField>
                </div>
              ) : null}

              {contentEntity === "projects" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Name">
                    <input value={contentDraft.name || ""} onChange={(event) => setContentDraft((current) => ({ ...current, name: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Category">
                    <input value={contentDraft.category || ""} onChange={(event) => setContentDraft((current) => ({ ...current, category: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <div className="md:col-span-2">
                    <AdminField label="Description">
                      <textarea value={contentDraft.description || ""} onChange={(event) => setContentDraft((current) => ({ ...current, description: event.target.value }))} className={adminTextareaClass} />
                    </AdminField>
                  </div>
                  <div className="md:col-span-2">
                    <AdminField label="Builders" hint="Comma or newline separated">
                      <textarea value={contentDraft.builders || ""} onChange={(event) => setContentDraft((current) => ({ ...current, builders: event.target.value }))} className={adminTextareaClass} />
                    </AdminField>
                  </div>
                  <AdminField label="Live Link">
                    <input value={contentDraft.link || ""} onChange={(event) => setContentDraft((current) => ({ ...current, link: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Repo Link">
                    <input value={contentDraft.repo_link || ""} onChange={(event) => setContentDraft((current) => ({ ...current, repo_link: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <div className="md:col-span-2">
                    <AdminField label="Image URL">
                      <input value={contentDraft.image_url || ""} onChange={(event) => setContentDraft((current) => ({ ...current, image_url: event.target.value }))} className={adminInputClass} />
                    </AdminField>
                  </div>
                  <AdminField label="Status">
                    <select value={contentDraft.status || "Published"} onChange={(event) => setContentDraft((current) => ({ ...current, status: event.target.value }))} className={adminSelectClass}>
                      {CONTENT_STATUS_OPTIONS.projects.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </AdminField>
                </div>
              ) : null}

              {contentEntity === "resources" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Name">
                    <input value={contentDraft.name || ""} onChange={(event) => setContentDraft((current) => ({ ...current, name: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Type">
                    <select value={contentDraft.type || "Link"} onChange={(event) => setContentDraft((current) => ({ ...current, type: event.target.value }))} className={adminSelectClass}>
                      {["Drive", "Doc", "Link", "Document", "Video"].map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </AdminField>
                  <div className="md:col-span-2">
                    <AdminField label="URL">
                      <input value={contentDraft.url || ""} onChange={(event) => setContentDraft((current) => ({ ...current, url: event.target.value }))} className={adminInputClass} />
                    </AdminField>
                  </div>
                  <AdminField label="Size">
                    <input value={contentDraft.size || ""} onChange={(event) => setContentDraft((current) => ({ ...current, size: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Category">
                    <select value={contentDraft.category || "Learning"} onChange={(event) => setContentDraft((current) => ({ ...current, category: event.target.value }))} className={adminSelectClass}>
                      {["Learning", "Training", "Document", "Media", "Hackathon"].map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Status">
                    <select value={contentDraft.status || "Published"} onChange={(event) => setContentDraft((current) => ({ ...current, status: event.target.value }))} className={adminSelectClass}>
                      {CONTENT_STATUS_OPTIONS.resources.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </AdminField>
                </div>
              ) : null}

              {contentEntity === "bounties" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Title">
                    <input value={contentDraft.title || ""} onChange={(event) => setContentDraft((current) => ({ ...current, title: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Reward">
                    <input value={contentDraft.reward || ""} onChange={(event) => setContentDraft((current) => ({ ...current, reward: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <div className="md:col-span-2">
                    <AdminField label="Description">
                      <textarea value={contentDraft.description || ""} onChange={(event) => setContentDraft((current) => ({ ...current, description: event.target.value }))} className={adminTextareaClass} />
                    </AdminField>
                  </div>
                  <AdminField label="Difficulty">
                    <select value={contentDraft.difficulty || "Medium"} onChange={(event) => setContentDraft((current) => ({ ...current, difficulty: event.target.value }))} className={adminSelectClass}>
                      {["Easy", "Medium", "Hard"].map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Status">
                    <select value={contentDraft.status || "Open"} onChange={(event) => setContentDraft((current) => ({ ...current, status: event.target.value }))} className={adminSelectClass}>
                      {CONTENT_STATUS_OPTIONS.bounties.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </AdminField>
                  <div className="md:col-span-2">
                    <AdminField label="Tags" hint="Comma or newline separated">
                      <textarea value={contentDraft.tags || ""} onChange={(event) => setContentDraft((current) => ({ ...current, tags: event.target.value }))} className={adminTextareaClass} />
                    </AdminField>
                  </div>
                  <div className="md:col-span-2">
                    <AdminField label="Submit Link">
                      <input value={contentDraft.submit_link || ""} onChange={(event) => setContentDraft((current) => ({ ...current, submit_link: event.target.value }))} className={adminInputClass} />
                    </AdminField>
                  </div>
                </div>
              ) : null}

              {contentEntity === "repos" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Name">
                    <input value={contentDraft.name || ""} onChange={(event) => setContentDraft((current) => ({ ...current, name: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Language">
                    <input value={contentDraft.language || ""} onChange={(event) => setContentDraft((current) => ({ ...current, language: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <div className="md:col-span-2">
                    <AdminField label="Description">
                      <textarea value={contentDraft.description || ""} onChange={(event) => setContentDraft((current) => ({ ...current, description: event.target.value }))} className={adminTextareaClass} />
                    </AdminField>
                  </div>
                  <div className="md:col-span-2">
                    <AdminField label="Repository URL">
                      <input value={contentDraft.url || ""} onChange={(event) => setContentDraft((current) => ({ ...current, url: event.target.value }))} className={adminInputClass} />
                    </AdminField>
                  </div>
                  <AdminField label="Stars">
                    <input value={contentDraft.stars || "0"} onChange={(event) => setContentDraft((current) => ({ ...current, stars: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Forks">
                    <input value={contentDraft.forks || "0"} onChange={(event) => setContentDraft((current) => ({ ...current, forks: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                  <AdminField label="Status">
                    <select value={contentDraft.status || "Published"} onChange={(event) => setContentDraft((current) => ({ ...current, status: event.target.value }))} className={adminSelectClass}>
                      {CONTENT_STATUS_OPTIONS.repos.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </AdminField>
                </div>
              ) : null}
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "finance" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
            <AdminPanel
              eyebrow="Approvals"
              title="Pending Requests"
              description="Approve or reject reimbursements, then inspect the audit trail in finance history."
            >
              <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                {pendingFinance.length > 0 ? (
                  pendingFinance.map((row) => (
                    <AdminListButton
                      key={row.id}
                      title={getFinanceRequesterName(row)}
                      meta={`${formatCurrency(row.amount)} VND • ${getFinanceDate(row)}`}
                      active={selectedFinanceId === row.id}
                      onClick={() => setSelectedFinanceId(row.id)}
                      badges={
                        <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                          Pending
                        </span>
                      }
                    />
                  ))
                ) : (
                  <AdminEmptyState
                    title="No pending finance requests"
                    description="The approval queue is currently empty."
                  />
                )}
              </div>
            </AdminPanel>

            <div className="space-y-6">
              <AdminPanel
                eyebrow="Request Detail"
                title="Finance Decision"
                description="Use this panel to inspect the request context before approving or rejecting it."
                actions={
                  selectedFinance &&
                  String(selectedFinance.status || "").toLowerCase() === "pending" ? (
                    <div className="flex flex-wrap gap-3">
                      <ActionButton
                        type="button"
                        variant="success"
                        onClick={() => void handleFinanceAction("approve", selectedFinance.id)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </span>
                      </ActionButton>
                      <ActionButton
                        type="button"
                        variant="danger"
                        onClick={() => void handleFinanceAction("reject", selectedFinance.id)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Reject
                        </span>
                      </ActionButton>
                    </div>
                  ) : null
                }
              >
                {selectedFinance ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-border-main bg-main-bg px-4 py-4">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                        Requester
                      </div>
                      <div className="mt-2 font-heading text-2xl font-black uppercase tracking-tight text-text-main">
                        {getFinanceRequesterName(selectedFinance)}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg px-4 py-4">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                        Amount
                      </div>
                      <div className="mt-2 font-heading text-2xl font-black uppercase tracking-tight text-text-main">
                        {formatCurrency(selectedFinance.amount)} VND
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg px-4 py-4">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                        Status
                      </div>
                      <div className="mt-2 font-mono text-sm font-bold uppercase tracking-[0.16em] text-text-main">
                        {selectedFinance.status || "Unknown"}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg px-4 py-4">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                        Date
                      </div>
                      <div className="mt-2 font-mono text-sm font-bold uppercase tracking-[0.16em] text-text-main">
                        {getFinanceDate(selectedFinance) || "No date"}
                      </div>
                    </div>
                    <div className="md:col-span-2 border border-border-main bg-main-bg px-4 py-4">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                        Reason
                      </div>
                      <div className="mt-2 whitespace-pre-wrap font-mono text-xs uppercase tracking-[0.08em] text-text-main">
                        {selectedFinance.reason || "No reason provided."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <AdminEmptyState
                    title="Select a finance request"
                    description="Choose a row from the queue to inspect and act on it."
                  />
                )}
              </AdminPanel>

              <AdminPanel
                eyebrow="Audit Trail"
                title="Finance History"
                description="Completed and rejected rows remain here as the admin trail for reimbursements."
              >
                <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
                  {contentData.finance_history.length > 0 ? (
                    contentData.finance_history.map((row) => (
                      <div
                        key={row.id}
                        className="border border-border-main bg-main-bg px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-heading text-lg font-black uppercase tracking-tight text-text-main">
                              {getFinanceRequesterName(row)}
                            </div>
                            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                              {getFinanceDate(row)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-heading text-xl font-black uppercase tracking-tight text-text-main">
                              {formatCurrency(row.amount)} VND
                            </div>
                            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                              {row.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <AdminEmptyState
                      title="No finance history"
                      description="Approved and rejected requests will appear here."
                    />
                  )}
                </div>
              </AdminPanel>
            </div>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "keys" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Automation"
              title="Agent Keys"
              description="Manage machine credentials used by internal agents and automation flows."
              actions={
                <ActionButton type="button" variant="secondary" onClick={startCreateKey}>
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Key
                  </span>
                </ActionButton>
              }
            >
              <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                {agentKeys.length > 0 ? (
                  agentKeys.map((row) => (
                    <AdminListButton
                      key={row.id}
                      title={row.name}
                      meta={`${(row.scopes || ["*"]).join(", ")} • ${formatDateTime(row.last_used_at || row.created_at)}`}
                      active={!creatingKey && selectedKeyId === row.id}
                      onClick={() => {
                        setCreatingKey(false);
                        setSelectedKeyId(row.id);
                      }}
                      badges={
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                            {row.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                      }
                    />
                  ))
                ) : (
                  <AdminEmptyState
                    title="No agent keys"
                    description="Create the first automation key for internal tooling."
                  />
                )}
              </div>
            </AdminPanel>

            <div className="space-y-6">
              <AdminPanel
                eyebrow={creatingKey ? "Create Key" : "Edit Key"}
                title="Key Editor"
                description="Scopes are stored as a list. Use a comma-separated string here for easier editing."
                actions={
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      type="button"
                      variant="primary"
                      onClick={() => void saveKey()}
                      disabled={keySaving}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {keySaving ? "Saving" : creatingKey ? "Create" : "Save"}
                      </span>
                    </ActionButton>
                    {!creatingKey ? (
                      <>
                        <ActionButton
                          type="button"
                          variant="secondary"
                          onClick={() => void rotateKey()}
                          disabled={keySaving}
                        >
                          <span className="inline-flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Rotate
                          </span>
                        </ActionButton>
                        <ActionButton
                          type="button"
                          variant="danger"
                          onClick={() => void deleteKey()}
                          disabled={keyDeleting}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            {keyDeleting ? "Deleting" : "Delete"}
                          </span>
                        </ActionButton>
                      </>
                    ) : null}
                  </div>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Display Name">
                    <input
                      value={keyDraft.name}
                      onChange={(event) =>
                        setKeyDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className={adminInputClass}
                    />
                  </AdminField>
                  <AdminField label="Scopes" hint="Comma or newline separated">
                    <input
                      value={keyDraft.scopesText}
                      onChange={(event) =>
                        setKeyDraft((current) => ({
                          ...current,
                          scopesText: event.target.value,
                        }))
                      }
                      className={adminInputClass}
                    />
                  </AdminField>
                </div>

                <div className="mt-4">
                  <AdminToggleRow
                    label="Key Active"
                    description="Inactive keys remain stored but can no longer authenticate."
                    checked={keyDraft.is_active}
                    onChange={(checked) =>
                      setKeyDraft((current) => ({
                        ...current,
                        is_active: checked,
                      }))
                    }
                  />
                </div>
              </AdminPanel>

              {issuedKey ? (
                <AdminPanel
                  eyebrow="Store Now"
                  title="Fresh Agent Key"
                  description="This raw key is shown only once. Store it in your secret manager before leaving the page."
                  tone="warning"
                >
                  <div className="border border-border-main bg-main-bg px-4 py-4 font-mono text-xs font-bold tracking-[0.04em] text-text-main">
                    {issuedKey}
                  </div>
                </AdminPanel>
              ) : null}
            </div>
          </div>
        </AdminPageSection>
      ) : null}
    </div>
  );
}
