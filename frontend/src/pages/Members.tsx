import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Twitter, Search, Send, ArrowRight } from "lucide-react";
import { SectionHeader, SoftBrutalCard } from "@/components/ui/Primitives";
import { ActionCard } from "@/components/ui/Cards";
import { useStore } from "@/store/useStore";
import { Member } from "@/types";

export function Members() {
  const navigate = useNavigate();
  const { members, fetchMembers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.skills.some((skill) => skill.toLowerCase().includes(query)) ||
      (member.role && member.role.toLowerCase().includes(query))
    );
  });

  const officialMembers = filteredMembers.filter(
    (m) => m.role !== "Community",
  );
  const communityMembers = filteredMembers.filter(
    (m) => m.role === "Community",
  );

  const MemberCard = ({ member, intent = "default" }: { member: Member, intent?: "default" | "primary" | "warning" | "success" | "danger" | "info" | "locked" | "accent" }) => (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${member.name}`}
      onClick={() => navigate(`/members/${member.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/members/${member.id}`);
        }
      }}
      className="h-full cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="relative h-full flex flex-col bg-surface border border-border-main transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,255,255,1)] overflow-hidden">
        
        {/* Header Cover Banner */}
        <div className={`h-20 w-full relative z-0  ${intent === "primary" ? "bg-primary" : "bg-highlight"} bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiLz48L3N2Zz4=')]`}>
          <div className="absolute inset-0 bg-gradient-to-t from-main-bg/20 to-transparent"></div>
        </div>

        {/* Avatar - Overlapping Banner */}
        <div className="absolute top-10 left-6 z-10">
          <div className="w-20 h-20 bg-surface border border-border-main p-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] group-hover:scale-110 transition-transform duration-300 group-hover:-rotate-3">
            <img
              src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              alt={member.name}
            />
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2 py-1 bg-surface font-mono text-[9px] uppercase font-black text-text-main border border-border-main">
          <span className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-primary animate-pulse' : 'bg-gray-400'}`}></span>
          {member.role === "Community" ? "COMMUNITY" : "CORE"}
        </div>

        {/* Card Body */}
        <div className="pt-14 px-6 pb-6 flex-1 flex flex-col relative z-0 bg-surface">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <h3 className="font-heading font-black text-xl md:text-2xl text-text-main group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                {member.name}
              </h3>
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mt-1">
              ID: {member.id.substring(0, 8)}
            </p>
          </div>

          <div className="inline-block self-start font-mono text-[10px] font-bold uppercase tracking-wider text-primary mb-4 transition-colors">
            {member.role || "Member"}
          </div>

          <div className="flex flex-wrap gap-2 mt-auto mb-6">
            {member.skills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="font-mono text-[9px] uppercase font-bold text-text-muted group-hover:text-text-main transition-colors mr-2 mb-1"
              >
                {s}
              </span>
            ))}
            {member.skills.length > 4 && (
              <span className="font-mono text-[9px] uppercase font-bold text-text-muted mr-2 mb-1">
                +{member.skills.length - 4}
              </span>
            )}
          </div>

          <div className="mt-auto pt-5  flex items-center justify-between">
            <div className="flex gap-2">
              {member.socials?.github && (
                <a
                  href={member.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5  hover:border-text-main bg-main-bg text-text-muted hover:text-text-main transition-colors hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {member.socials?.twitter && (
                <a
                  href={member.socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5  hover:border-text-main bg-main-bg text-text-muted hover:text-text-main transition-colors hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {member.socials?.telegram && (
                <a
                  href={member.socials.telegram}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5  hover:border-text-main bg-main-bg text-text-muted hover:text-text-main transition-colors hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-black tracking-widest text-text-muted group-hover:text-primary transition-colors">
              <span>View</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 space-y-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6 pb-8">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tight text-text-main">
            Members
          </h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-3">
            Browse the builders and learners in our community.
          </p>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface  p-4 pl-12 font-mono text-xs font-bold uppercase tracking-widest placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:focus:shadow-[4px_4px_0_0_#1a1b26]"
          />
        </div>
      </div>

      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-2 h-2 bg-primary"></div>
          <h2 className="font-heading font-bold text-2xl uppercase tracking-tight text-text-main">
            Official Members
          </h2>
        </div>
        {officialMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {officialMembers.map((member) => (
              <MemberCard key={member.id} member={member} intent="primary" />
            ))}
          </div>
        ) : (
          <div className=" bg-surface p-12 text-center text-text-muted font-mono uppercase text-xs tracking-widest">
            No official members found.
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-2 h-2 bg-highlight"></div>
          <h2 className="font-heading font-bold text-2xl uppercase tracking-tight text-text-main">
            Community
          </h2>
        </div>
        {communityMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {communityMembers.map((member) => (
              <MemberCard key={member.id} member={member} intent="primary" />
            ))}
          </div>
        ) : (
          <div className="bg-surface p-12 text-center text-text-muted font-mono uppercase text-xs tracking-widest">
            No community members found.
          </div>
        )}
      </section>
    </div>
  );
}
