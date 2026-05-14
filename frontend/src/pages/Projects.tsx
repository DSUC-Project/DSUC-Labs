import toast from "react-hot-toast";
import React, { useState } from "react";
import {
  SectionHeader,
  SoftBrutalCard,
  ActionButton,
  StatusBadge,
} from "@/components/ui/Primitives";
import { useStore } from "@/store/useStore";
import { Project } from "@/types";
import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ModalShell } from "@/components/ui/ModalShell";
import { Card, ActionCard } from "@/components/ui/Cards";
import { cn } from "@/lib/utils";

function AddProjectModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (p: Project) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    onAdd({
      id: Math.random().toString(),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      builders: (formData.get("builders") as string)
        .split(",")
        .map((s) => s.trim()),
      link: formData.get("link") as string,
      repoLink: formData.get("repoLink") as string,
      tech_stack: (formData.get("tech_stack") as string)
        .split(",")
        .map((s) => s.trim()),
      status: "Draft",
    });
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Add Project"
      label="REGISTRY"
      footer={
        <div className="w-full flex items-center justify-end">
          <ActionButton
            onClick={() =>
              document
                .getElementById("add-project-form")
                ?.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true }),
                )
            }
            variant="primary"
          >
            Submit Project
          </ActionButton>
        </div>
      }
    >
      <form id="add-project-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Project Name
          </label>
          <input
            name="name"
            required
            className="w-full bg-surface px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            required
            className="w-full bg-surface  px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Category
          </label>
          <input
            name="category"
            placeholder="e.g. Infrastructure, DeFi"
            required
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Tech Stack (comma separated)
          </label>
          <input
            name="tech_stack"
            placeholder="React, Node, Solana"
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Builders (comma separated)
          </label>
          <input
            name="builders"
            placeholder="Zah, Cuong..."
            required
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Website Link
            </label>
            <input
              name="link"
              required
              className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              GitHub Repo
            </label>
            <input
              name="repoLink"
              className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary"
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export function Projects() {
  const { projects, addProject, currentUser } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const canManage = currentUser?.memberType === "member";

  const handleAddClick = () => {
    if (!currentUser) {
      toast("Vui lòng đăng nhập trước!");
      return;
    }
    if (!canManage) {
      toast("Tài khoản cộng đồng không thể tạo dự án.");
      return;
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <SectionHeader
          title="Project Showcase"
          subtitle="Products shipped by DSUC builders."
          className="mb-4 md:mb-0"
        />

        <div className="w-full md:w-auto">
          {canManage ? (
            <ActionButton
              variant="primary"
              className="w-full md:w-auto min-w-[150px]"
              onClick={handleAddClick}
            >
              <span className="flex justify-center items-center gap-2">
                <Plus size={16} /> Add Project
              </span>
            </ActionButton>
          ) : (
            <div className="px-4 py-2 bg-main-bg border border-border-main text-xs font-mono text-text-muted text-center">
              Restricted to Members
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <Link
            to={`/project/${proj.id}`}
            key={proj.id}
            className="block h-full cursor-pointer focus:outline-none"
          >
            <SoftBrutalCard intent="primary" interactive className="h-full p-6 flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-primary font-mono text-lg">↗</span>
              </div>

              <div className="flex flex-col flex-1 w-full">
                <div className="flex items-start justify-between mb-2 gap-4">
                  <h3 className="font-heading font-bold text-xl uppercase tracking-tight truncate pr-6 group-hover:text-primary transition-colors">
                    {proj.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono uppercase font-bold tracking-widest">
                    {proj.category}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase font-bold",
                      proj.status === "Published"
                        ? "text-emerald-500"
                        : "text-primary",
                    )}
                  >
                    {proj.status || "LIVE"}
                  </span>
                </div>

                <p className="text-sm text-text-muted mb-6 flex-1 line-clamp-3 leading-relaxed">
                  {proj.description}
                </p>

                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {proj.tech_stack.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 bg-main-bg text-[9px] font-mono whitespace-nowrap text-text-muted"
                      >
                        {t}
                      </span>
                    ))}
                    {proj.tech_stack.length > 4 && (
                      <span className="px-2 py-1 bg-main-bg text-text-muted text-[9px] font-mono">
                        +{proj.tech_stack.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-4 mt-auto  w-full flex items-end justify-between">
                  <div className="flex flex-col w-full">
                    <span className="text-[9px] font-mono uppercase text-text-muted mb-1 font-bold">
                      Builders
                    </span>
                    <span className="text-xs font-bold truncate text-text-main group-hover:text-primary transition-colors">
                      {proj.builders.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </SoftBrutalCard>
          </Link>
        ))}
      </div>

      <AddProjectModal
        isOpen={isAddModalOpen && canManage}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addProject}
      />
    </div>
  );
}
