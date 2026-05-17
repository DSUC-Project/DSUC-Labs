import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  SectionHeader,
  ActionButton,
} from "@/components/ui/Primitives";
import { useStore } from "@/store/useStore";
import { Project } from "@/types";
import {
  FolderKanban,
  Github,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ModalShell } from "@/components/ui/ModalShell";
import { Card } from "@/components/ui/Cards";
import { ShowcaseCard } from "@/components/ui/ShowcaseCard";

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
  const { projects, fetchProjects, addProject, currentUser } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const canManage = currentUser?.memberType === "member";

  useEffect(() => {
    fetchProjects().catch(() => {});
  }, [fetchProjects]);

  const categories = [
    "All",
    ...Array.from(
      new Set(
        projects
          .map((project) => project.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    ),
  ];

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.trim().toLowerCase();
    const techStack =
      project.tech_stack && project.tech_stack.length > 0
        ? project.tech_stack
        : project.techStack || [];
    const builderNames = project.builders.join(", ");
    const matchesSearch =
      !query ||
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.category.toLowerCase().includes(query) ||
      builderNames.toLowerCase().includes(query) ||
      techStack.some((item) => item.toLowerCase().includes(query));
    const matchesCategory =
      activeCategory === "All" || project.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

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
    <div className="container mx-auto space-y-12 px-4 py-8 md:py-16">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader
          title="Project Showcase"
          subtitle="Products shipped by DSUC builders."
          className="mb-0 border-none pb-0"
        />

        <div className="mt-4 flex w-full gap-4 md:mt-0 md:w-auto">
          {canManage ? (
            <ActionButton
              variant="primary"
              className="w-full md:w-auto"
              onClick={handleAddClick}
            >
              <span className="flex justify-center items-center gap-2">
                <Plus size={16} /> Add Project
              </span>
            </ActionButton>
          ) : (
            <div className="border border-border-main bg-main-bg px-4 py-2 text-center font-mono text-xs text-text-muted">
              Restricted to Members
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`border border-border-main px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                activeCategory === category
                  ? "bg-primary font-bold text-main-bg"
                  : "bg-surface text-text-muted shadow-sm hover:bg-main-bg hover:text-text-main"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="relative w-full shrink-0 md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full border border-border-main bg-surface p-3 pl-10 font-mono text-xs shadow-sm transition-colors focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((proj) => {
          const techStack =
            proj.tech_stack && proj.tech_stack.length > 0
              ? proj.tech_stack
              : proj.techStack || [];
          const builders = proj.builders.filter(Boolean);

          return (
            <Link
              to={`/project/${proj.id}`}
              key={proj.id}
              className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-main-bg"
            >
              <ShowcaseCard
                icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
                title={proj.name}
                category={proj.category}
                accentLabel={proj.status || "Live"}
                description={proj.description}
                tags={techStack}
                footerLabel="Builders"
                footerValue={builders.join(", ") || "DSUC Builders"}
                footerAside={
                  <>
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                      {builders.length}
                    </span>
                    {proj.repoLink ? (
                      <Github className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                  </>
                }
              />
            </Link>
          );
        })}

        {filteredProjects.length === 0 && (
          <Card className="col-span-full p-12 text-center font-mono text-xs font-bold uppercase tracking-widest text-text-muted shadow-sm">
            No projects found.
          </Card>
        )}
      </div>

      <AddProjectModal
        isOpen={isAddModalOpen && canManage}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addProject}
      />
    </div>
  );
}
