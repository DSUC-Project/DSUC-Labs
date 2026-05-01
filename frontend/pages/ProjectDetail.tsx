import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Github, RadioTower, Share2 } from 'lucide-react';

import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '@/components/ui/Primitives';
import { useStore } from '@/store/useStore';

export function ProjectDetail() {
  const { id } = useParams();
  const { projects, addToast } = useStore();
  const project = projects.find((item) => item.id === id);

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          title="Project not found"
          message="The requested project record does not exist in the current product store."
          action={
            <Link to="/projects" className="action-button action-button-secondary">
              Back to Projects
            </Link>
          }
        />
      </div>
    );
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    addToast('Project link copied to clipboard.', 'success');
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Link to="/projects" className="action-button action-button-ghost">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Projects
        </Link>
      </div>

      <PageHeader
        eyebrow="Project Detail"
        title={project.name}
        subtitle={project.description}
        actions={
          <>
            <StatusBadge tone="info">{project.category}</StatusBadge>
            <StatusBadge>{project.status || 'Published'}</StatusBadge>
            <button type="button" onClick={handleCopyLink} className="action-button action-button-secondary">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Copy Link
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="p-7">
          <div className="space-y-6">
            <div>
              <p className="section-eyebrow">Overview</p>
              <div className="prose-dsuc mt-4 max-w-none">
                <p>{project.description}</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-border-main bg-main-bg p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Builder team</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.builders.map((builder) => (
                  <span
                    key={builder}
                    className="rounded-full border border-border-main bg-surface px-3 py-1 text-sm text-text-main"
                  >
                    {builder}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-7">
          <div className="space-y-5">
            <div>
              <p className="section-eyebrow">Links</p>
              <h2 className="section-title">Outbound routes</h2>
              <p className="section-subtitle">
                Keep live and repository actions explicit. Nothing here is decorative.
              </p>
            </div>

            <div className="grid gap-3">
              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button action-button-primary"
                >
                  <RadioTower className="h-4 w-4" aria-hidden="true" />
                  Open Live Project
                </a>
              ) : (
                <button type="button" disabled className="action-button action-button-ghost">
                  Live link unavailable
                </button>
              )}
              {project.repoLink ? (
                <a
                  href={project.repoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button action-button-secondary"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  Open GitHub
                </a>
              ) : (
                <button type="button" disabled className="action-button action-button-ghost">
                  GitHub link unavailable
                </button>
              )}
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`action-button ${project.link ? 'action-button-ghost' : 'action-button-ghost pointer-events-none opacity-60'}`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open in New Tab
              </a>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
