import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Github,
  Search,
  Send,
  Sparkles,
  Twitter,
  Users,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { Member } from "@/types";

function isCommunityMember(member: Member) {
  return (
    member.memberType === "community" ||
    member.member_type === "community" ||
    member.role === "Community"
  );
}

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
    (member) => !isCommunityMember(member),
  );
  const communityMembers = filteredMembers.filter((member) => isCommunityMember(member));

  const MemberCard = ({
    member,
    intent = "default",
  }: {
    member: Member;
    intent?:
      | "default"
      | "primary"
      | "warning"
      | "success"
      | "danger"
      | "info"
      | "locked"
      | "accent";
  }) => (
    <article className="group relative flex h-full flex-col overflow-hidden border border-border-main bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:-translate-x-1.5 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
      <button
        type="button"
        aria-label={`View ${member.name}`}
        onClick={() => navigate(`/members/${member.id}`)}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div
          className={`relative z-0 h-16 w-full ${
            intent === "primary" ? "bg-primary" : "bg-highlight"
          } bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiLz48L3N2Zz4=')]`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-main-bg/20 to-transparent"></div>
        </div>

        <div className="absolute left-5 top-8 z-10">
          <div className="h-16 w-16 bg-surface p-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-105 dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
            <img
              src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`}
              className="h-full w-full object-cover"
              alt={member.name}
            />
          </div>
        </div>

        <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 border border-border-main bg-surface px-2 py-1 font-mono text-[9px] font-black uppercase text-text-main">
          <span
            className={`h-2 w-2 rounded-full ${member.is_active ? "bg-primary animate-pulse" : "bg-gray-400"}`}
          ></span>
          {isCommunityMember(member) ? "COMMUNITY" : "CORE"}
        </div>

        <div className="relative z-0 flex flex-1 flex-col gap-5 bg-surface px-5 pb-5 pt-12">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-1 font-heading text-xl font-black tracking-tight text-text-main transition-colors group-hover:text-primary md:text-2xl">
                {member.name}
              </h3>
            </div>
            <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
              ID: {member.id.substring(0, 8)}
            </p>
          </div>

          <div className="inline-flex self-start border border-border-main bg-main-bg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary transition-colors">
            {member.role || "Member"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border-main bg-main-bg px-3 py-2">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Skills
              </p>
              <p className="mt-1 font-heading text-lg font-black text-text-main">
                {member.skills.length}
              </p>
            </div>
            <div className="border border-border-main bg-main-bg px-3 py-2">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Status
              </p>
              <p className="mt-1 font-heading text-lg font-black text-text-main">
                {member.is_active ? "Live" : "Idle"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {member.skills.slice(0, 3).map((s) => (
              <span
                key={s}
                className="border border-border-main bg-main-bg px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted transition-colors group-hover:text-text-main"
              >
                {s}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="border border-border-main bg-main-bg px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                +{member.skills.length - 3}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-border-main pt-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              {isCommunityMember(member) ? "Community Profile" : "Official Profile"}
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-text-muted transition-colors group-hover:text-primary">
              <span>View</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between gap-4 border-t border-border-main bg-main-bg/60 px-5 py-3">
        <div className="flex gap-2">
          {member.socials?.github && (
            <a
              href={member.socials.github}
              target="_blank"
              rel="noreferrer"
              className="min-h-10 min-w-10 bg-main-bg p-2 text-text-muted transition-colors hover:text-text-main hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
              aria-label={`${member.name} GitHub`}
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {member.socials?.twitter && (
            <a
              href={member.socials.twitter}
              target="_blank"
              rel="noreferrer"
              className="min-h-10 min-w-10 bg-main-bg p-2 text-text-muted transition-colors hover:text-text-main hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
              aria-label={`${member.name} Twitter`}
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {member.socials?.telegram && (
            <a
              href={member.socials.telegram}
              target="_blank"
              rel="noreferrer"
              className="min-h-10 min-w-10 bg-main-bg p-2 text-text-muted transition-colors hover:text-text-main hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
              aria-label={`${member.name} Telegram`}
            >
              <Send className="w-4 h-4" />
            </a>
          )}
        </div>

        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          {[
            member.socials?.github,
            member.socials?.twitter,
            member.socials?.telegram,
          ].filter(Boolean).length || "No"} links
        </span>
      </div>
    </article>
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-14 space-y-12">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="space-y-5">
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tight text-text-main">
              Members
            </h1>
            <p className="mt-3 max-w-2xl text-xs font-mono uppercase tracking-widest text-gray-500">
              Browse the builders and learners in our community.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-border-main bg-surface px-4 py-4">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                <Users className="h-4 w-4 text-primary" />
                Total
              </div>
              <p className="mt-3 font-heading text-3xl font-black text-text-main">
                {filteredMembers.length}
              </p>
            </div>
            <div className="border border-border-main bg-surface px-4 py-4">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                <Sparkles className="h-4 w-4 text-primary" />
                Official
              </div>
              <p className="mt-3 font-heading text-3xl font-black text-text-main">
                {officialMembers.length}
              </p>
            </div>
            <div className="border border-border-main bg-surface px-4 py-4">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                <Users className="h-4 w-4 text-primary" />
                Community
              </div>
              <p className="mt-3 font-heading text-3xl font-black text-text-main">
                {communityMembers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full shrink-0 lg:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface p-4 pl-12 font-mono text-xs font-bold uppercase tracking-widest placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-border-main pb-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-primary"></div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-tight text-text-main">
              Official Members
            </h2>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {officialMembers.length} profiles
          </span>
        </div>
        {officialMembers.length > 0 ? (
          <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {officialMembers.map((member) => (
              <MemberCard key={member.id} member={member} intent="primary" />
            ))}
          </div>
        ) : (
          <div className="bg-surface p-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
            No official members found.
          </div>
        )}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-border-main pb-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-primary"></div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-tight text-text-main">
              Community
            </h2>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {communityMembers.length} profiles
          </span>
        </div>
        {communityMembers.length > 0 ? (
          <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
