import toast from "react-hot-toast";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Github, Share2 } from "lucide-react";
import { useStore } from "../store/useStore";
import {
  SectionHeader,
  SoftBrutalCard,
  StatusBadge,
  ActionButton,
} from "@/components/ui/Primitives";
import { Card, ActionCard } from "@/components/ui/Cards";
import { useLocale } from "@/lib/locale";

export function ProjectDetail() {
  const { text } = useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useStore();

  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="text-text-muted text-center pt-20 font-mono text-sm uppercase">
        {text("Project Not Found", "Không tìm thấy dự án")}
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast(text("Link copied to clipboard.", "Đã sao chép liên kết."));
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 space-y-12">
      <button
        onClick={() => navigate("/projects")}
        className="inline-flex items-center gap-2 border-2 border-text-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest font-mono shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all text-text-main"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        {text("Back to Projects", "Quay lại dự án")}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className="p-8 md:p-12 relative h-full flex flex-col shadow-none">
          <button
            onClick={handleCopyLink}
            className="absolute top-8 right-8 text-text-muted hover:text-text-main bg-surface p-3 border border-border-main transition-colors z-20 shadow-sm hover:-translate-y-0.5"
            title={text("Share link", "Chia sẻ liên kết")}
          >
            <Share2 size={20} />
          </button>

          <div className="flex flex-col md:flex-row items-start gap-8 mb-12 relative z-10 w-full xl:w-5/6 pr-12 md:pr-24">
            <div className="flex-1 mt-2">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="px-2 py-0.5 bg-main-bg border border-border-main text-[10px] font-mono uppercase font-bold text-text-main">
                  {project.category}
                </div>
                <span className="text-[10px] text-emerald-500 font-mono font-bold tracking-widest uppercase flex items-center gap-2 px-3 py-1 border border-border-main bg-main-bg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  ONLINE
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-text-main mb-6 leading-tight tracking-tight uppercase">
                {project.name}
              </h1>

              <div className="flex flex-wrap gap-2">
                {project.builders.map((b) => (
                  <span
                    key={b}
                    className="text-[10px] font-mono font-bold tracking-wide text-text-muted uppercase bg-main-bg px-3 py-1 border border-border-main cursor-default"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-12 relative z-10 bg-main-bg border border-border-main p-8 mt-8">
            <h3 className="text-xs font-mono font-bold text-text-muted uppercase mb-6 tracking-widest flex items-center gap-3">
              <span className="w-2 h-2 bg-primary block" /> {text("Overview", "Tổng quan")}
            </h3>
            <p className="text-text-main font-sans text-lg font-medium leading-relaxed">
              {project.description}
            </p>

            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="mt-8  pt-6">
                <h4 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-4 font-bold">
                  {text("Tech Stack", "Tech Stack")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] font-mono font-bold uppercase bg-surface px-2 py-1 border border-border-main text-text-main"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 mt-auto pt-8 border-t  border-border-main">
            <ActionButton
              variant="primary"
              onClick={() => window.open(project.link, "_blank")}
              className="w-full h-14"
            >
              <span className="flex items-center justify-center gap-2">
                <ExternalLink size={20} /> {text("View Demo", "Xem demo")}
              </span>
            </ActionButton>
            {project.repoLink && (
              <ActionButton
                variant="secondary"
                onClick={() => window.open(project.repoLink, "_blank")}
                className="w-full h-14 bg-surface"
              >
                <span className="flex items-center justify-center gap-2">
                  <Github size={20} /> {text("Source Code", "Mã nguồn")}
                </span>
              </ActionButton>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
