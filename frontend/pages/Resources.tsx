import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  Plus,
  Trophy,
  Video,
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
import type { Resource, ResourceCategory } from '@/types';

const CATEGORIES: Array<ResourceCategory | 'All'> = [
  'All',
  'Learning',
  'Training',
  'Document',
  'Media',
  'Hackathon',
];

function categoryLabel(category: ResourceCategory | 'All') {
  const labels: Record<ResourceCategory | 'All', string> = {
    All: 'All',
    Learning: 'Learning',
    Training: 'Training',
    Document: 'Document',
    Media: 'Media',
    Hackathon: 'Hackathon',
  };

  return labels[category];
}

function getResourceMeta(resource: Resource) {
  if (resource.category === 'Media' || resource.type === 'Video') {
    return { icon: Video, tone: 'warning' as const };
  }
  if (resource.category === 'Hackathon') {
    return { icon: Trophy, tone: 'warning' as const };
  }
  if (resource.category === 'Learning' || resource.category === 'Training') {
    return { icon: BookOpen, tone: 'info' as const };
  }
  if (resource.type === 'Drive') {
    return { icon: FolderOpen, tone: 'info' as const };
  }
  return { icon: FileText, tone: 'default' as const };
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function Resources() {
  const { resources, addResource, currentUser, addToast } = useStore();
  const uiPreview = useUiPreview();
  const [filter, setFilter] = useState<ResourceCategory | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = uiPreview.canManageResources;

  const filteredResources = useMemo(
    () => (filter === 'All' ? resources : resources.filter((resource) => resource.category === filter)),
    [filter, resources]
  );

  const handleAddClick = () => {
    if (!canManage) {
      addToast('Resource publishing is locked for this role preview.', 'info');
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
        eyebrow="Resources"
        title="The club knowledge base."
        subtitle="A calmer resource index for learning material, documents, training collateral, media, and hackathon references."
        actions={
          <>
            <StatusBadge tone="info">{resources.length} indexed</StatusBadge>
            <button type="button" onClick={handleAddClick} className="action-button action-button-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Resource
            </button>
          </>
        }
      />

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Filters"
          title="Browse by category"
          subtitle="Keep the list compact and searchable by intent."
        />
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                filter === category
                  ? 'border-primary bg-primary text-main-bg'
                  : 'border-border-main bg-surface text-text-main hover:bg-main-bg'
              }`}
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>
      </section>

      {filteredResources.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No resources in this category"
          message="Switch the active filter or add a new resource entry to populate the index."
        />
      )}

      <AddResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addResource}
      />
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const { addToast } = useStore();
  const meta = getResourceMeta(resource);
  const hostname = getHostname(resource.url);

  const handleOpen = () => {
    if (!resource.url) {
      addToast('This resource does not have a valid URL yet.', 'info');
      return;
    }
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <SurfaceCard interactive className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-border-main bg-main-bg text-primary">
          <meta.icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={meta.tone}>{resource.category}</StatusBadge>
          <StatusBadge>{resource.type}</StatusBadge>
        </div>
      </div>

      <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-text-main">
        {resource.name}
      </h3>
      <p className="mt-3 text-sm leading-7 text-text-muted">
        {hostname
          ? `Hosted on ${hostname}${resource.size ? ` • ${resource.size}` : ''}.`
          : `Linked resource${resource.size ? ` • ${resource.size}` : ''}.`}
      </p>

      <div className="mt-5 rounded-[20px] border border-border-main bg-main-bg p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Source</p>
        <p className="mt-2 break-all text-sm text-text-main">
          {resource.url || 'Pending URL'}
        </p>
      </div>

      <div className="mt-6 border-t border-border-main pt-5">
        <button type="button" onClick={handleOpen} className="action-button action-button-secondary">
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Open Resource
        </button>
      </div>
    </SurfaceCard>
  );
}

function AddResourceModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resource: Resource) => void;
}) {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    onAdd({
      id: Math.random().toString(),
      name: String(formData.get('name') || ''),
      url: String(formData.get('url') || ''),
      type: String(formData.get('type') || 'Link') as Resource['type'],
      category: String(formData.get('category') || 'Document') as ResourceCategory,
      size: String(formData.get('size') || '') || undefined,
    });
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
            <p className="section-eyebrow">Resource Intake</p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-main">
              Add a knowledge asset
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              This stays wired to the existing resource creation path. Preview mode only unlocks the UI.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <Field label="Resource name">
              <input name="name" required className="input-shell" placeholder="Academy roadmap deck" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Type">
                <select name="type" className="input-shell">
                  <option value="Link">Link</option>
                  <option value="Drive">Drive</option>
                  <option value="Doc">Doc</option>
                  <option value="Document">Document</option>
                  <option value="Video">Video</option>
                </select>
              </Field>
              <Field label="Category">
                <select name="category" className="input-shell">
                  {CATEGORIES.filter((item): item is ResourceCategory => item !== 'All').map((category) => (
                    <option key={category} value={category}>
                      {categoryLabel(category)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="URL">
              <input name="url" type="url" required className="input-shell" placeholder="https://..." />
            </Field>
            <Field label="Optional size / note">
              <input name="size" className="input-shell" placeholder="PDF • 4 MB" />
            </Field>
            <div className="mt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="action-button action-button-ghost">
                Cancel
              </button>
              <button type="submit" className="action-button action-button-primary">
                Publish Resource
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
