import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  FileText,
  Folder,
  Link as LinkIcon,
  Video,
  Search,
  Plus,
  Globe,
} from "lucide-react";
import {
  SectionHeader,
  ActionButton,
} from "@/components/ui/Primitives";
import { useStore } from "@/store/useStore";
import { Resource, ResourceCategory } from "@/types";
import { ModalShell } from "@/components/ui/ModalShell";
import { Card } from "@/components/ui/Cards";
import { ShowcaseCard } from "@/components/ui/ShowcaseCard";
import { useLocale } from "@/lib/locale";

const CATEGORIES: ResourceCategory[] = [
  "Learning",
  "Training",
  "Document",
  "Media",
  "Hackathon",
];

function getResourceCategoryLabel(
  value: string,
  text: (english: string, vietnamese: string) => string,
) {
  switch (value) {
    case "All":
      return text("All", "Tất cả");
    case "Learning":
      return text("Learning", "Học tập");
    case "Training":
      return text("Training", "Thực hành");
    case "Document":
      return text("Document", "Tài liệu");
    case "Media":
      return text("Media", "Media");
    case "Hackathon":
      return text("Hackathon", "Hackathon");
    default:
      return value;
  }
}

function getResourceTypeLabel(
  value: string,
  text: (english: string, vietnamese: string) => string,
) {
  switch (value) {
    case "Document":
      return text("Document", "Tài liệu");
    case "Video":
      return text("Video", "Video");
    case "Drive":
      return text("Folder / Drive", "Thư mục / Drive");
    case "Link":
      return text("Link", "Link");
    case "Doc":
      return text("Doc", "Doc");
    default:
      return value;
  }
}

function AddResourceModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (r: Resource) => void;
}) {
  const { text } = useLocale();
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
      title={text("Add Resource", "Thêm tài nguyên")}
      label={text("LIBRARY", "THƯ VIỆN")}
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
            {text("Upload Resource", "Lưu tài nguyên")}
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
            {text("Title / Name", "Tiêu đề / tên")}
          </label>
          <input
            name="name"
            required
            className="w-full bg-surface px-4 py-3 outline-none font-sans text-sm transition-all focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {text("Description", "Mô tả")}
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
            {text("Type", "Loại")}
          </label>
          <select
            name="type"
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all appearance-none focus:border-primary cursor-pointer"
          >
            <option value="Document">{text("Document", "Tài liệu")}</option>
            <option value="Video">{text("Video", "Video")}</option>
            <option value="Drive">{text("Folder / Drive", "Thư mục / Drive")}</option>
            <option value="Link">{text("Link", "Link")}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {text("Category", "Danh mục")}
          </label>
          <select
            name="category"
            className="w-full bg-surface border border-border-main px-4 py-3 outline-none font-sans text-sm transition-all appearance-none focus:border-primary cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {getResourceCategoryLabel(c, text)}
              </option>
            ))}
          </select>
        </div>
      </form>
    </ModalShell>
  );
}

export function Resources() {
  const { text } = useLocale();
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
        return <FileText className="h-5 w-5" aria-hidden="true" />;
      case "Drive":
        return <Folder className="h-5 w-5" aria-hidden="true" />;
      case "Video":
        return <Video className="h-5 w-5" aria-hidden="true" />;
      default:
        return <LinkIcon className="h-5 w-5" aria-hidden="true" />;
    }
  };

  const getResourceSource = (url: string, fallbackType: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return fallbackType || text("External link", "Liên kết ngoài");
    }
  };

  const handleAddClick = () => {
    if (!currentUser) {
      toast(text("Please sign in first.", "Vui lòng đăng nhập trước."));
      return;
    }
    if (!canManage) {
      toast(
        text(
          "Community accounts cannot add resources.",
          "Tài khoản community không thể thêm tài nguyên.",
        ),
      );
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-8">
        <SectionHeader
          title={text("Resources", "Tài nguyên")}
          subtitle={text(
            "Documentation, guides, and tools for the community.",
            "Tài liệu, hướng dẫn và công cụ dành cho cộng đồng.",
          )}
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
                <Plus size={16} /> {text("Add Resource", "Thêm tài nguyên")}
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
              {getResourceCategoryLabel(c, text)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={text("Search resources...", "Tìm tài nguyên...")}
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
            className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-main-bg"
          >
            <ShowcaseCard
              icon={getIcon(resource.type || "Link")}
              title={resource.title || resource.name}
              category={getResourceCategoryLabel(resource.category, text)}
              accentLabel={getResourceTypeLabel(resource.type || "Link", text)}
              description={resource.description}
              tags={resource.tags || []}
              footerLabel={text("Source", "Nguồn")}
              footerValue={getResourceSource(resource.url, resource.type || "Link")}
              footerAside={
                <>
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                    {text("Open", "Mở")}
                  </span>
                </>
              }
            />
          </a>
        ))}
        {filteredResources.length === 0 && (
          <Card className="col-span-full p-12 text-center text-text-muted font-mono text-xs uppercase font-bold tracking-widest shadow-sm">
            {text("No resources found.", "Không tìm thấy tài nguyên nào.")}
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
