import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  ExternalLink,
  GitBranch,
  Github,
  Plus,
  Star,
  X,
} from 'lucide-react';

import { useUiPreview } from '@/components/Layout';
import {
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui/Primitives';
import { useStore } from '@/store/useStore';
import type { Bounty, Repo } from '@/types';

type WorkTab = 'bounties' | 'repos';

export function Work() {
  const { bounties, repos, addBounty, addRepo, currentUser, addToast } = useStore();
  const uiPreview = useUiPreview();
  const [activeTab, setActiveTab] = useState<WorkTab>('bounties');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = uiPreview.canManageWork;

  const orderedBounties = useMemo(() => {
    const order = ['Open', 'In Progress', 'Completed', 'Closed'];
    return [...bounties].sort(
      (left, right) => order.indexOf(left.status) - order.indexOf(right.status)
    );
  }, [bounties]);

  const handleAddClick = () => {
    if (!canManage) {
      addToast('Work publishing is locked for this role preview.', 'info');
      return;
    }
    if (!currentUser && uiPreview.previewOnly) {
      addToast('Preview unlocked. Real authentication is still required to submit.', 'info');
    }
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <PageHeader
        eyebrow="Work"
        title="Club workstreams and open-source delivery."
        subtitle="Bounties are now readable task cards, while repos stay as compact shipping records for the engineering side of DSUC Labs."
        actions={
          <>
            <StatusBadge tone="info">{bounties.length} bounties</StatusBadge>
            <StatusBadge>{repos.length} repos</StatusBadge>
            <button type="button" onClick={handleAddClick} className="action-button action-button-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add {activeTab === 'bounties' ? 'Bounty' : 'Repo'}
            </button>
          </>
        }
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('bounties')}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            activeTab === 'bounties'
              ? 'border-primary bg-primary text-main-bg'
              : 'border-border-main bg-surface text-text-main hover:bg-main-bg'
          }`}
        >
          Bounties
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('repos')}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            activeTab === 'repos'
              ? 'border-primary bg-primary text-main-bg'
              : 'border-border-main bg-surface text-text-main hover:bg-main-bg'
          }`}
        >
          Repositories
        </button>
      </div>

      {activeTab === 'bounties' ? (
        <section className="space-y-5">
          <SectionHeader
            eyebrow="Task Board"
            title="Current bounties"
            subtitle="Reward, difficulty, skills, and submission status are all visible without opening the card."
          />
          {orderedBounties.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {orderedBounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No bounties yet"
              message="Once the store contains work items, they will appear here as structured task cards."
            />
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <SectionHeader
            eyebrow="Engineering Ledger"
            title="Open-source repositories"
            subtitle="Each repo keeps its language, traction, and outbound route visible in one line."
          />
          {repos.length > 0 ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No repositories yet"
              message="Published club repositories will appear here once the backend data is available."
            />
          )}
        </section>
      )}

      <AddWorkModal
        type={activeTab}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBounty={addBounty}
        onAddRepo={addRepo}
      />
    </div>
  );
}

function BountyCard({ bounty }: { bounty: Bounty }) {
  const difficultyTone =
    bounty.difficulty === 'Hard'
      ? 'danger'
      : bounty.difficulty === 'Medium'
        ? 'warning'
        : 'success';

  return (
    <SurfaceCard interactive className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <StatusBadge tone={difficultyTone}>{bounty.difficulty}</StatusBadge>
          <StatusBadge>{bounty.status}</StatusBadge>
        </div>
        <div className="rounded-[18px] border border-border-main bg-warning-soft px-4 py-3 text-lg font-semibold text-text-main">
          {bounty.reward}
        </div>
      </div>

      <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-text-main">
        {bounty.title}
      </h3>

      <div className="mt-5 rounded-[20px] border border-border-main bg-main-bg p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Skills / tags</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {bounty.tags.length > 0 ? (
            bounty.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-main bg-surface px-3 py-1 text-xs text-text-main"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-text-muted">No tags added.</span>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-border-main pt-5">
        {bounty.submitLink ? (
          <a
            href={bounty.submitLink}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button action-button-secondary"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open / Submit
          </a>
        ) : (
          <button type="button" disabled className="action-button action-button-ghost">
            No submission link yet
          </button>
        )}
      </div>
    </SurfaceCard>
  );
}

function RepoCard({ repo }: { repo: Repo }) {
  return (
    <SurfaceCard interactive className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-border-main bg-main-bg text-primary">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="info">{repo.language || 'Code'}</StatusBadge>
          <StatusBadge>{repo.status || 'Published'}</StatusBadge>
        </div>
      </div>

      <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-text-main">
        {repo.name}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{repo.description}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-border-main bg-main-bg p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Stars</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-text-main">
            <Star className="h-4 w-4 text-primary" aria-hidden="true" />
            {repo.stars}
          </p>
        </div>
        <div className="rounded-[20px] border border-border-main bg-main-bg p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Forks</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-text-main">
            <GitBranch className="h-4 w-4 text-primary" aria-hidden="true" />
            {repo.forks}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-border-main pt-5">
        {repo.repoLink ? (
          <a
            href={repo.repoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button action-button-secondary"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            Open Repository
          </a>
        ) : (
          <button type="button" disabled className="action-button action-button-ghost">
            Repository link unavailable
          </button>
        )}
      </div>
    </SurfaceCard>
  );
}

function AddWorkModal({
  type,
  isOpen,
  onClose,
  onAddBounty,
  onAddRepo,
}: {
  type: WorkTab;
  isOpen: boolean;
  onClose: () => void;
  onAddBounty: (bounty: Bounty) => void;
  onAddRepo: (repo: Repo) => void;
}) {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    if (type === 'bounties') {
      onAddBounty({
        id: Math.random().toString(),
        title: String(formData.get('title') || ''),
        reward: String(formData.get('reward') || ''),
        difficulty: String(formData.get('difficulty') || 'Easy') as Bounty['difficulty'],
        status: String(formData.get('status') || 'Open') as Bounty['status'],
        tags: String(formData.get('tags') || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        submitLink: String(formData.get('submitLink') || '') || undefined,
      });
    } else {
      onAddRepo({
        id: Math.random().toString(),
        name: String(formData.get('name') || ''),
        description: String(formData.get('description') || ''),
        language: String(formData.get('language') || ''),
        stars: Number(formData.get('stars') || 0),
        forks: Number(formData.get('forks') || 0),
        repoLink: String(formData.get('repoLink') || '') || undefined,
      });
    }

    onClose();
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl rounded-[32px] border border-border-main bg-surface-elevated p-7 shadow-soft-xl"
          onClick={(innerEvent) => innerEvent.stopPropagation()}
        >
          <button type="button" onClick={onClose} className="icon-button absolute right-5 top-5">
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-2">
            <p className="section-eyebrow">{type === 'bounties' ? 'Bounty Intake' : 'Repo Intake'}</p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-main">
              {type === 'bounties' ? 'Publish a new bounty' : 'Register a repository'}
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              This stays connected to the current store actions. Preview mode only unlocks the interface.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {type === 'bounties' ? (
              <>
                <Field label="Title">
                  <input name="title" required className="input-shell" placeholder="Build the Academy progress chart" />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Reward">
                    <input name="reward" required className="input-shell" placeholder="2,000,000 VND" />
                  </Field>
                  <Field label="Difficulty">
                    <select name="difficulty" className="input-shell">
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Status">
                    <select name="status" className="input-shell">
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </Field>
                  <Field label="Tags">
                    <input name="tags" className="input-shell" placeholder="frontend, academy, charts" />
                  </Field>
                </div>
                <Field label="Submission URL">
                  <input name="submitLink" type="url" className="input-shell" placeholder="https://..." />
                </Field>
              </>
            ) : (
              <>
                <Field label="Repository name">
                  <input name="name" required className="input-shell" placeholder="dsuc-labs-frontend" />
                </Field>
                <Field label="Description">
                  <textarea
                    name="description"
                    rows={4}
                    required
                    className="input-shell min-h-[120px] resize-none"
                    placeholder="What this repository is for."
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Language">
                    <input name="language" required className="input-shell" placeholder="TypeScript" />
                  </Field>
                  <Field label="Stars">
                    <input name="stars" type="number" min="0" className="input-shell" defaultValue="0" />
                  </Field>
                  <Field label="Forks">
                    <input name="forks" type="number" min="0" className="input-shell" defaultValue="0" />
                  </Field>
                </div>
                <Field label="Repository URL">
                  <input name="repoLink" type="url" className="input-shell" placeholder="https://github.com/..." />
                </Field>
              </>
            )}
            <div className="mt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="action-button action-button-ghost">
                Cancel
              </button>
              <button type="submit" className="action-button action-button-primary">
                {type === 'bounties' ? 'Create Bounty' : 'Register Repo'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</span>
      {children}
    </label>
  );
}
