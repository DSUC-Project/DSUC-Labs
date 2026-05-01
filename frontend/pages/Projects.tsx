import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Code2, Github, Plus, RadioTower, Users, X } from 'lucide-react';

import { useUiPreview } from '@/components/Layout';
import { ActionButton, PageHeader, StatusBadge, SurfaceCard } from '@/components/ui/Primitives';
import { useStore } from '@/store/useStore';
import type { Project } from '@/types';

export function Projects() {
  const { projects, addProject, currentUser, addToast } = useStore();
  const uiPreview = useUiPreview();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const canManage = uiPreview.canManageProjects;

  const handleAddClick = () => {
    if (!canManage) {
      addToast('Project publishing is locked for this role preview.', 'info');
      return;
    }
    if (!currentUser && uiPreview.previewOnly) {
      addToast('Preview unlocked. Real authentication is still required to submit.', 'info');
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <PageHeader
        eyebrow="Projects"
        title="Product work, not placeholder cards."
        subtitle="Project cards stay operational: category, status, team, links, and a clear route into the product detail page."
        actions={
          <>
            <StatusBadge tone="info">{projects.length} listed</StatusBadge>
            <ActionButton variant={canManage ? 'primary' : 'ghost'} onClick={handleAddClick}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Project
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <SurfaceCard key={project.id} interactive className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <StatusBadge>{project.category}</StatusBadge>
                <StatusBadge tone="warning">{project.status || 'Published'}</StatusBadge>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-main bg-primary/10 text-primary">
                <Code2 className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-text-main">
              {project.name}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{project.description}</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-[20px] border border-border-main bg-main-bg p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Builder team</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.builders.map((builder) => (
                    <span
                      key={builder}
                      className="rounded-full border border-border-main px-3 py-1 text-xs text-text-main"
                    >
                      {builder}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border-main pt-5">
              <Link to={`/project/${project.id}`}>
                <ActionButton variant="secondary">
                  View
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </ActionButton>
              </Link>
              {project.repoLink ? (
                <a href={project.repoLink} target="_blank" rel="noopener noreferrer">
                  <ActionButton variant="ghost">
                    <Github className="h-4 w-4" aria-hidden="true" />
                    GitHub
                  </ActionButton>
                </a>
              ) : null}
              {project.link ? (
                <a href={project.link} target="_blank" rel="noopener noreferrer">
                  <ActionButton variant="ghost">
                    <RadioTower className="h-4 w-4" aria-hidden="true" />
                    Live
                  </ActionButton>
                </a>
              ) : null}
            </div>
          </SurfaceCard>
        ))}
      </div>

      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addProject}
      />
    </div>
  );
}

function AddProjectModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Project) => void;
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
      description: String(formData.get('description') || ''),
      category: String(formData.get('category') || ''),
      builders: String(formData.get('builders') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      link: String(formData.get('link') || ''),
      repoLink: String(formData.get('repoLink') || ''),
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
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl rounded-[32px] border border-border-main bg-surface-elevated p-7 shadow-soft-xl"
          onClick={(innerEvent) => innerEvent.stopPropagation()}
        >
          <button type="button" onClick={onClose} className="icon-button absolute right-5 top-5">
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-2">
            <p className="section-eyebrow">Project Intake</p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-main">
              Publish a project card
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              This form stays connected to the existing project creation logic. Preview mode only unlocks the UI.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <Field label="Project name">
              <input name="name" required className="input-shell" placeholder="DSUC Builder Dashboard" />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                rows={4}
                required
                className="input-shell min-h-[120px] resize-none"
                placeholder="What this project does and why it matters."
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category">
                <input name="category" required className="input-shell" placeholder="Education, Tooling, Infra..." />
              </Field>
              <Field label="Builder team">
                <input name="builders" required className="input-shell" placeholder="Comma-separated names" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Live URL">
                <input name="link" type="url" required className="input-shell" placeholder="https://..." />
              </Field>
              <Field label="GitHub URL">
                <input name="repoLink" type="url" className="input-shell" placeholder="https://github.com/..." />
              </Field>
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <ActionButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </ActionButton>
              <ActionButton type="submit">Create Project</ActionButton>
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
