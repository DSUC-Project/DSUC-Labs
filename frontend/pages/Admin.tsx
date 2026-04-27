import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';

import {
  AcademyActivity,
  AcademyOverview,
  Bounty,
  Event,
  Member,
  Project,
  PublishStatus,
  Repo,
  Resource,
} from '../types';
import { useStore } from '../store/useStore';

type EditableUser = {
  id: string;
  name: string;
  email: string;
  wallet_address: string;
  member_type: 'member' | 'community';
  role: string;
  academy_access: boolean;
  is_active: boolean;
};

type ContentEntity = 'events' | 'projects' | 'resources' | 'bounties' | 'repos';

type AdminContentData = {
  events: Event[];
  projects: Project[];
  resources: Resource[];
  bounties: Bounty[];
  repos: Repo[];
  finance_requests: any[];
  finance_history: any[];
};

const ROLE_OPTIONS = ['President', 'Vice-President', 'Tech-Lead', 'Media-Lead', 'Member'];
const PUBLISH_STATUS_OPTIONS: PublishStatus[] = ['Draft', 'Published', 'Archived'];
const BOUNTY_STATUS_OPTIONS: Bounty['status'][] = ['Open', 'In Progress', 'Completed', 'Closed'];

const EMPTY_CONTENT_DATA: AdminContentData = {
  events: [],
  projects: [],
  resources: [],
  bounties: [],
  repos: [],
  finance_requests: [],
  finance_history: [],
};

function buildAuthHeaders(token: string | null, walletAddress: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers['x-wallet-address'] = walletAddress;
  }

  return headers;
}

function formatLessonLabel(activity: AcademyActivity) {
  return `${String(activity.track || '').toUpperCase()} / ${activity.lesson_id}`;
}

function formatRequesterName(row: any) {
  return row.requester_name || row.requesterName || 'Unknown';
}

function formatAmount(value: string | number | undefined) {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) {
    return String(value || '0');
  }

  return numeric.toLocaleString('vi-VN');
}

export function Admin() {
  const { currentUser, authToken, walletAddress, fetchMembers } = useStore();
  const [users, setUsers] = useState<Member[]>([]);
  const [academyOverview, setAcademyOverview] = useState<AcademyOverview[]>([]);
  const [academyHistory, setAcademyHistory] = useState<AcademyActivity[]>([]);
  const [contentData, setContentData] = useState<AdminContentData>(EMPTY_CONTENT_DATA);
  const [contentDrafts, setContentDrafts] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, EditableUser>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusSavingKey, setStatusSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [financeActionId, setFinanceActionId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<EditableUser>({
    id: '',
    name: '',
    email: '',
    wallet_address: '',
    member_type: 'community',
    role: 'Community',
    academy_access: true,
    is_active: true,
  });

  const headers = useMemo(
    () => buildAuthHeaders(authToken, walletAddress),
    [authToken, walletAddress]
  );

  const academyMap = useMemo(() => {
    return new Map(academyOverview.map((item) => [item.user_id, item]));
  }, [academyOverview]);

  const memberCount = users.filter(
    (user) => (user.memberType || user.member_type) !== 'community'
  ).length;
  const communityCount = users.filter(
    (user) => (user.memberType || user.member_type) === 'community'
  ).length;
  const pendingFinance = contentData.finance_requests.filter(
    (row) => row.status === 'pending'
  );

  const applyUsers = (nextUsers: Member[]) => {
    setUsers(nextUsers);
    setDrafts(
      Object.fromEntries(
        nextUsers.map((user: Member) => [
          user.id,
          {
            id: user.id,
            name: user.name,
            email: user.email || '',
            wallet_address: user.wallet_address || '',
            member_type:
              user.memberType === 'community' || user.member_type === 'community'
                ? 'community'
                : 'member',
            role: user.role,
            academy_access:
              user.academyAccess !== false && user.academy_access !== false,
            is_active: user.is_active !== false,
          },
        ])
      )
    );
  };

  const applyContentData = (nextData: Partial<AdminContentData>) => {
    const merged: AdminContentData = {
      ...EMPTY_CONTENT_DATA,
      ...nextData,
    };

    setContentData(merged);

    const nextDrafts: Record<string, string> = {};
    const attachStatusDrafts = (entity: ContentEntity, items: any[]) => {
      items.forEach((item) => {
        nextDrafts[`${entity}:${item.id}`] = item.status || '';
      });
    };

    attachStatusDrafts('events', merged.events);
    attachStatusDrafts('projects', merged.projects);
    attachStatusDrafts('resources', merged.resources);
    attachStatusDrafts('bounties', merged.bounties);
    attachStatusDrafts('repos', merged.repos);
    setContentDrafts(nextDrafts);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const [usersRes, academyRes, historyRes, contentRes] = await Promise.all([
        fetch(`${base}/api/members/admin/list`, {
          headers,
          credentials: 'include',
        }),
        fetch(`${base}/api/academy/admin/overview`, {
          headers,
          credentials: 'include',
        }),
        fetch(`${base}/api/academy/admin/history`, {
          headers,
          credentials: 'include',
        }),
        fetch(`${base}/api/admin/overview`, {
          headers,
          credentials: 'include',
        }),
      ]);

      const usersResult = await usersRes.json();
      const academyResult = await academyRes.json();
      const historyResult = await historyRes.json();
      const contentResult = await contentRes.json();

      applyUsers(usersResult?.data || []);
      setAcademyOverview(academyResult?.data || []);
      setAcademyHistory(historyResult?.data || []);
      applyContentData(contentResult?.data || EMPTY_CONTENT_DATA);
      await fetchMembers();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [headers]);

  const updateDraft = (id: string, patch: Partial<EditableUser>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
        role:
          (patch.member_type || prev[id]?.member_type) === 'community'
            ? 'Community'
            : patch.role || prev[id]?.role || 'Member',
      },
    }));
  };

  const saveUser = async (id: string) => {
    const draft = drafts[id];
    if (!draft) {
      return;
    }

    setSavingId(id);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/api/members/admin/users/${id}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.message || 'Failed to update user');
      }

      await refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to update user');
    } finally {
      setSavingId(null);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const payload = {
        ...createForm,
        role: createForm.member_type === 'community' ? 'Community' : createForm.role,
      };

      const res = await fetch(`${base}/api/members/admin/users`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.message || 'Failed to create user');
      }

      setCreateForm({
        id: '',
        name: '',
        email: '',
        wallet_address: '',
        member_type: 'community',
        role: 'Community',
        academy_access: true,
        is_active: true,
      });
      await refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to create user');
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingKey(`user:${id}`);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/api/members/admin/users/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.message || 'Failed to delete user');
      }

      await refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    } finally {
      setDeletingKey(null);
    }
  };

  const updateContentDraft = (entity: ContentEntity, id: string, status: string) => {
    setContentDrafts((prev) => ({
      ...prev,
      [`${entity}:${id}`]: status,
    }));
  };

  const saveContentStatus = async (entity: ContentEntity, id: string) => {
    const status = contentDrafts[`${entity}:${id}`];
    if (!status) {
      return;
    }

    setStatusSavingKey(`${entity}:${id}`);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/api/admin/content/${entity}/${id}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.message || 'Failed to update status');
      }

      await refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    } finally {
      setStatusSavingKey(null);
    }
  };

  const deleteContent = async (entity: ContentEntity, id: string, label: string) => {
    if (!window.confirm(`Delete "${label}" from ${entity}? This action cannot be undone.`)) {
      return;
    }

    setDeletingKey(`content:${entity}:${id}`);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/api/admin/content/${entity}/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.message || 'Failed to delete content');
      }

      await refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to delete content');
    } finally {
      setDeletingKey(null);
    }
  };

  const runFinanceAction = async (id: string, action: 'approve' | 'reject') => {
    setFinanceActionId(`${action}:${id}`);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/api/finance/${action}/${id}`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.message || `Failed to ${action} request`);
      }

      await refresh();
    } catch (error: any) {
      alert(error.message || 'Finance action failed');
    } finally {
      setFinanceActionId(null);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-cyber-blue/20 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyber-blue mb-2">
            Executive Admin
          </div>
          <h1 className="text-4xl font-display font-bold text-white">Control Plane</h1>
          <p className="text-white/60 mt-2">
            Manage members, content status, finance processing, and academy learning history.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="bg-cyber-blue text-white hover:bg-white hover:text-black font-display font-bold text-sm px-5 py-3 cyber-button uppercase tracking-widest inline-flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={ShieldCheck} label="Official Members" value={String(memberCount)} />
        <StatCard icon={Users} label="Community" value={String(communityCount)} />
        <StatCard icon={RefreshCw} label="Academy Learners" value={String(academyOverview.filter((item) => item.academy_access).length)} />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={createUser}
        className="cyber-card p-6 bg-surface/50 border border-cyber-blue/20 space-y-4"
      >
        <div className="flex items-center gap-2 text-cyber-yellow font-display font-bold uppercase tracking-widest">
          <Plus size={16} /> Create Account
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
            required
            className="bg-black/30 border border-white/10 p-3 text-white outline-none"
          />
          <input
            value={createForm.email}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="bg-black/30 border border-white/10 p-3 text-white outline-none"
          />
          <input
            value={createForm.wallet_address}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, wallet_address: e.target.value }))}
            placeholder="Wallet address (optional)"
            className="bg-black/30 border border-white/10 p-3 text-white outline-none"
          />
          <select
            value={createForm.member_type}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                member_type: e.target.value as 'member' | 'community',
                role: e.target.value === 'community' ? 'Community' : 'Member',
              }))
            }
            className="bg-black/30 border border-white/10 p-3 text-white outline-none"
          >
            <option value="community">Community</option>
            <option value="member">Member</option>
          </select>
          <select
            value={createForm.role}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
            disabled={createForm.member_type === 'community'}
            className="bg-black/30 border border-white/10 p-3 text-white outline-none disabled:opacity-50"
          >
            {createForm.member_type === 'community' ? (
              <option value="Community">Community</option>
            ) : (
              ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))
            )}
          </select>
          <button
            type="submit"
            className="bg-cyber-yellow text-black hover:bg-white font-display font-bold py-3 cyber-button uppercase tracking-widest"
          >
            Create User
          </button>
        </div>
      </motion.form>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-white uppercase">Users</h2>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
            President / Vice-President Only
          </span>
        </div>
        {loading ? (
          <div className="text-white/40 font-mono">Loading admin data...</div>
        ) : (
          users.map((user) => {
            const draft = drafts[user.id];
            const overview = academyMap.get(user.id);

            return (
              <div
                key={user.id}
                className="cyber-card p-5 bg-surface/50 border border-white/10 space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                  <input
                    value={draft?.name || ''}
                    onChange={(e) => updateDraft(user.id, { name: e.target.value })}
                    className="bg-black/30 border border-white/10 p-3 text-white outline-none"
                  />
                  <input
                    value={draft?.email || ''}
                    onChange={(e) => updateDraft(user.id, { email: e.target.value })}
                    className="bg-black/30 border border-white/10 p-3 text-white outline-none"
                  />
                  <input
                    value={draft?.wallet_address || ''}
                    onChange={(e) => updateDraft(user.id, { wallet_address: e.target.value })}
                    placeholder="Wallet"
                    className="bg-black/30 border border-white/10 p-3 text-white outline-none"
                  />
                  <select
                    value={draft?.member_type || 'member'}
                    onChange={(e) =>
                      updateDraft(user.id, {
                        member_type: e.target.value as 'member' | 'community',
                      })
                    }
                    className="bg-black/30 border border-white/10 p-3 text-white outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="community">Community</option>
                  </select>
                  <select
                    value={draft?.role || 'Member'}
                    onChange={(e) => updateDraft(user.id, { role: e.target.value })}
                    disabled={draft?.member_type === 'community'}
                    className="bg-black/30 border border-white/10 p-3 text-white outline-none disabled:opacity-50"
                  >
                    {draft?.member_type === 'community' ? (
                      <option value="Community">Community</option>
                    ) : (
                      ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => void saveUser(user.id)}
                      disabled={savingId === user.id || deletingKey === `user:${user.id}`}
                      className="bg-cyber-blue text-white hover:bg-white hover:text-black font-display font-bold py-3 cyber-button uppercase tracking-widest disabled:opacity-60"
                    >
                      {savingId === user.id ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => void deleteUser(user.id, draft?.name || user.name)}
                      disabled={deletingKey === `user:${user.id}` || currentUser.id === user.id}
                      className="bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white font-display font-bold py-3 uppercase tracking-widest disabled:opacity-40"
                    >
                      {deletingKey === `user:${user.id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/60">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft?.academy_access ?? true}
                      onChange={(e) =>
                        updateDraft(user.id, { academy_access: e.target.checked })
                      }
                    />
                    Academy Access
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft?.is_active ?? true}
                      onChange={(e) =>
                        updateDraft(user.id, { is_active: e.target.checked })
                      }
                    />
                    Active
                  </label>
                  <span>ID: {user.id}</span>
                  <span>Streak: {overview?.streak || user.streak || 0}</span>
                  <span>XP: {overview?.xp || 0}</span>
                  <span>Lessons: {overview?.completed_lessons || 0}</span>
                  <span>Quizzes: {overview?.quiz_passed || 0}</span>
                  <span>
                    Last Activity:{' '}
                    {overview?.last_activity
                      ? new Date(overview.last_activity).toLocaleString()
                      : 'No progress yet'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white uppercase">Content Status</h2>
          <p className="text-white/40 font-mono text-xs mt-1">
            Draft / publish / archive every public surface without touching SQL.
          </p>
        </div>

        <StatusSection
          title="Events"
          entity="events"
          items={contentData.events}
          statusOptions={PUBLISH_STATUS_OPTIONS}
          getTitle={(item) => `${item.title} • ${item.date}`}
          drafts={contentDrafts}
          savingKey={statusSavingKey}
          deletingKey={deletingKey}
          onDraftChange={updateContentDraft}
          onSave={saveContentStatus}
          onDelete={deleteContent}
        />
        <StatusSection
          title="Projects"
          entity="projects"
          items={contentData.projects}
          statusOptions={PUBLISH_STATUS_OPTIONS}
          getTitle={(item) => item.name}
          drafts={contentDrafts}
          savingKey={statusSavingKey}
          deletingKey={deletingKey}
          onDraftChange={updateContentDraft}
          onSave={saveContentStatus}
          onDelete={deleteContent}
        />
        <StatusSection
          title="Resources"
          entity="resources"
          items={contentData.resources}
          statusOptions={PUBLISH_STATUS_OPTIONS}
          getTitle={(item) => item.name}
          drafts={contentDrafts}
          savingKey={statusSavingKey}
          deletingKey={deletingKey}
          onDraftChange={updateContentDraft}
          onSave={saveContentStatus}
          onDelete={deleteContent}
        />
        <StatusSection
          title="Bounties"
          entity="bounties"
          items={contentData.bounties}
          statusOptions={BOUNTY_STATUS_OPTIONS}
          getTitle={(item) => item.title}
          drafts={contentDrafts}
          savingKey={statusSavingKey}
          deletingKey={deletingKey}
          onDraftChange={updateContentDraft}
          onSave={saveContentStatus}
          onDelete={deleteContent}
        />
        <StatusSection
          title="Open Source Repos"
          entity="repos"
          items={contentData.repos}
          statusOptions={PUBLISH_STATUS_OPTIONS}
          getTitle={(item) => item.name}
          drafts={contentDrafts}
          savingKey={statusSavingKey}
          deletingKey={deletingKey}
          onDraftChange={updateContentDraft}
          onSave={saveContentStatus}
          onDelete={deleteContent}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white uppercase">Finance Queue</h2>
          <p className="text-white/40 font-mono text-xs mt-1">
            Pending requests can still be approved or rejected from here.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingFinance.length === 0 ? (
            <div className="cyber-card p-5 bg-surface/50 border border-white/10 text-white/40 font-mono text-sm">
              No pending finance requests.
            </div>
          ) : (
            pendingFinance.map((row) => (
              <div
                key={row.id}
                className="cyber-card p-5 bg-surface/50 border border-white/10 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-display font-bold text-white">
                      {formatRequesterName(row)}
                    </div>
                    <div className="text-[11px] font-mono text-white/40">
                      {row.date || row.created_at || 'No date'}
                    </div>
                  </div>
                  <div className="text-cyber-yellow font-display font-bold">
                    {formatAmount(row.amount)} VND
                  </div>
                </div>
                <p className="text-sm text-white/70">{row.reason || 'No reason provided'}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => void runFinanceAction(row.id, 'approve')}
                    disabled={financeActionId === `approve:${row.id}`}
                    className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-2 font-display font-bold uppercase text-xs disabled:opacity-60"
                  >
                    {financeActionId === `approve:${row.id}` ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => void runFinanceAction(row.id, 'reject')}
                    disabled={financeActionId === `reject:${row.id}`}
                    className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 font-display font-bold uppercase text-xs disabled:opacity-60"
                  >
                    {financeActionId === `reject:${row.id}` ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white uppercase">Academy History</h2>
          <p className="text-white/40 font-mono text-xs mt-1">
            Track who studied what, when they started, and what they completed.
          </p>
        </div>

        <div className="cyber-card bg-surface/50 border border-white/10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 px-5 py-3 border-b border-white/10 text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
            <div>User</div>
            <div>Lesson</div>
            <div>Action</div>
            <div>Snapshot</div>
            <div>Recorded At</div>
          </div>
          <div className="divide-y divide-white/10">
            {academyHistory.length === 0 ? (
              <div className="px-5 py-6 text-white/40 font-mono text-sm">
                No academy history yet.
              </div>
            ) : (
              academyHistory.slice(0, 80).map((activity) => (
                <div
                  key={activity.id}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 px-5 py-4 text-sm"
                >
                  <div>
                    <div className="text-white font-display font-bold">
                      {activity.user_name}
                    </div>
                    <div className="text-[11px] font-mono text-white/40">
                      {activity.member_type} • {activity.role}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/80">{formatLessonLabel(activity)}</div>
                    <div className="text-[11px] font-mono text-white/40 uppercase">
                      {activity.track} / {activity.lesson_id}
                    </div>
                  </div>
                  <div className="text-cyber-blue font-mono uppercase text-xs">
                    {activity.action.replaceAll('_', ' ')}
                  </div>
                  <div className="text-[11px] font-mono text-white/60">
                    <div>XP: {activity.xp_snapshot}</div>
                    <div>Lesson: {activity.lesson_completed ? 'done' : 'not yet'}</div>
                    <div>Quiz: {activity.quiz_passed ? 'passed' : 'pending'}</div>
                  </div>
                  <div className="text-[11px] font-mono text-white/60">
                    {new Date(activity.recorded_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusSection<T extends { id: string; status?: string }>({
  title,
  entity,
  items,
  statusOptions,
  getTitle,
  drafts,
  savingKey,
  deletingKey,
  onDraftChange,
  onSave,
  onDelete,
}: {
  title: string;
  entity: ContentEntity;
  items: T[];
  statusOptions: readonly string[];
  getTitle: (item: T) => string;
  drafts: Record<string, string>;
  savingKey: string | null;
  deletingKey: string | null;
  onDraftChange: (entity: ContentEntity, id: string, status: string) => void;
  onSave: (entity: ContentEntity, id: string) => Promise<void>;
  onDelete: (entity: ContentEntity, id: string, label: string) => Promise<void>;
}) {
  return (
    <div className="cyber-card p-5 bg-surface/50 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-bold text-white uppercase">{title}</h3>
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
          {items.length} items
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-white/40 font-mono text-sm">No records.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const draftKey = `${entity}:${item.id}`;
            const draftStatus = drafts[draftKey] || item.status || statusOptions[0];

            return (
              <div
                key={item.id}
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),220px,240px] gap-3 items-center border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-white font-display font-bold truncate">
                    {getTitle(item)}
                  </div>
                  <div className="text-[11px] font-mono text-white/40">ID: {item.id}</div>
                </div>

                <select
                  value={draftStatus}
                  onChange={(e) => onDraftChange(entity, item.id, e.target.value)}
                  className="bg-black/30 border border-white/10 p-3 text-white outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => void onSave(entity, item.id)}
                    disabled={savingKey === draftKey || deletingKey === `content:${entity}:${item.id}`}
                    className="bg-cyber-blue text-white hover:bg-white hover:text-black font-display font-bold py-3 cyber-button uppercase tracking-widest disabled:opacity-60"
                  >
                    {savingKey === draftKey ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => void onDelete(entity, item.id, getTitle(item))}
                    disabled={deletingKey === `content:${entity}:${item.id}`}
                    className="bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white font-display font-bold py-3 uppercase tracking-widest disabled:opacity-40"
                  >
                    {deletingKey === `content:${entity}:${item.id}` ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="cyber-card p-5 bg-surface/50 border border-cyber-blue/20">
      <div className="flex items-center gap-3 mb-4 text-cyber-blue">
        <Icon size={18} />
        <span className="text-xs font-mono uppercase tracking-[0.25em]">
          {label}
        </span>
      </div>
      <div className="text-3xl font-display font-bold text-white">{value}</div>
    </div>
  );
}
