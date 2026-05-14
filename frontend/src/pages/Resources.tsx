import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import {
  FileText,
  Folder,
  Link as LinkIcon,
  Video,
  ExternalLink,
  Search,
  Plus,
  X,
} from "lucide-react";
import {
  SectionHeader,
  SoftBrutalCard,
  StatusBadge,
  ActionButton,
} from "@/components/ui/Primitives";
import { useStore } from "@/store/useStore";
import { Resource, ResourceCategory } from "@/types";
import { motion } from "motion/react";
import { ModalShell } from "@/components/ui/ModalShell";
import { Card, ActionCard } from "@/components/ui/Cards";

const CATEGORIES: ResourceCategory[] = [
  "Learning",
  "Training",
  "Document",
  "Media",
  "Hackathon",
];

function AddResourceModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (r: Resource) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    onAdd({
      id: Math.random().toString(),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      url: formData.get("url") as string,
      type: formData.get("type") as
        | "Link"
        | "Document"
        | "Video"
        | "Drive"
        | "Doc",
      category: formData.get("category") as ResourceCategory,
      size: "N/A",
    });
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Add Resource"
      label="LIBRARY"
      footer={
        <div className="w-full flex items-center justify-end">
          <ActionButton
            onClick={() =>
              document
                .getElementById("add-resource-form")
                ?.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true }),
                )
            }
            variant="primary"
          >
            Upload Resource
          </ActionButton>
        </div>
      }
    >
      <form
        id="add-resource-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Title / Name
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
            required
            rows={3}
            className="w-full bg-surface  px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            URL
          </label>
          <input
            name="url"
            required
            type="url"
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary text-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Type
          </label>
          <select
            name="type"
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all appearance-none focus:border-primary cursor-pointer"
          >
            <option value="Document">Document</option>
            <option value="Video">Video</option>
            <option value="Drive">Folder / Drive</option>
            <option value="Link">Link</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Category
          </label>
          <select
            name="category"
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all appearance-none focus:border-primary cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </form>
    </ModalShell>
  );
}

export function Resources() {
  const { resources, fetchResources, addResource, currentUser } = useStore();
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = currentUser?.memberType === "member";

  useEffect(() => {
    fetchResources().catch(() => {});
  }, [fetchResources]);

  useEffect(() => {
    if (resources && resources.length > 0) {
      setData(resources);
    }
  }, [resources]);

  const categories = ["All", ...CATEGORIES];

  const filteredResources = data.filter((r) => {
    const rTitle = r.title || r.name || "";
    const rDesc = r.description || "";
    const matchesSearch =
      rTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rDesc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "Doc":
      case "Document":
        return <FileText className="w-5 h-5 text-primary" />;
      case "Drive":
        return <Folder className="w-5 h-5 text-emerald-500" />;
      case "Video":
        return <Video className="w-5 h-5 text-highlight" />;
      default:
        return <LinkIcon className="w-5 h-5 text-text-main" />;
    }
  };

  const handleAddClick = () => {
    if (!currentUser) {
      toast("Vui lòng đăng nhập trước!");
      return;
    }
    if (!canManage) {
      toast("Tài khoản cộng đồng không thể thêm tài nguyên.");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-8">
        <SectionHeader
          title="Resources"
          subtitle="Documentation, guides, and tools for the community."
          className="mb-0 border-none pb-0"
        />
        <div className="w-full md:w-auto mt-4 md:mt-0 flex gap-4">
          {canManage && (
            <ActionButton
              variant="primary"
              onClick={handleAddClick}
              className="w-full md:w-auto"
            >
              <span className="flex items-center gap-2 justify-center">
                <Plus size={16} /> Add Resource
              </span>
            </ActionButton>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border border-border-main transition-colors ${activeCategory === c ? "bg-primary text-main-bg font-bold" : "bg-surface hover:bg-main-bg text-text-muted hover:text-text-main shadow-sm"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border-main p-3 pl-10 font-mono text-xs focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            key={resource.id}
            className="block group focus:outline-none h-full"
          >
            <SoftBrutalCard intent="info" interactive className="flex flex-col h-full p-6">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-main-bg border border-border-main group-hover:bg-cyan-400 group-hover:text-surface transition-colors shadow-sm">
                  {getIcon(resource.type || "Link")}
                </div>
                <div className="pt-1">
                  <h3 className="font-heading font-bold text-lg leading-tight group-hover:text-cyan-400 transition-colors pr-6">
                    {resource.title || resource.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-main-bg border border-border-main text-text-muted font-bold">
                      {resource.category || "GENERAL"}
                    </span>
                    <span className="font-mono text-[9px] uppercase text-cyan-400 font-bold tracking-widest">
                      {resource.type || "Link"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-muted flex-grow line-clamp-3 leading-relaxed mb-6 font-mono">
                {resource.description || "No description provided."}
              </p>

              {resource.tags && resource.tags.length > 0 && (
                <div className="pt-4  mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {resource.tags.slice(0, 4).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono uppercase bg-main-bg px-2 py-1 border-b  text-text-muted font-bold tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SoftBrutalCard>
          </a>
        ))}
        {filteredResources.length === 0 && (
          <Card className="col-span-full p-12 text-center text-text-muted font-mono text-xs uppercase font-bold tracking-widest shadow-sm">
            No resources found.
          </Card>
        )}
      </div>

      <AddResourceModal
        isOpen={isModalOpen && canManage}
        onClose={() => setIsModalOpen(false)}
        onAdd={addResource}
      />
    </div>
  );
}
