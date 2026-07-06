import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Github, Search, Send, Twitter } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Member } from "@/types";
import { useLocale } from "@/lib/locale";

function isCommunityMember(member: Member) {
  return (
    member.memberType === "community" ||
    member.member_type === "community" ||
    member.role === "Community"
  );
}

function translateMemberRole(
  role: string | undefined,
  text: (english: string, vietnamese: string) => string,
) {
  if (!role) return text("Member", "Thành viên");
  if (role === "Community") return text("Community", "Cộng đồng");
  return role;
}

export function Members() {
  const { text } = useLocale();
  const navigate = useNavigate();
  const { members } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

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
  const communityMembers = filteredMembers.filter((member) =>
    isCommunityMember(member),
  );

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
  }) => {
    const socialLinks = [
      member.socials?.github
        ? { href: member.socials.github, label: "GitHub", icon: Github }
        : null,
      member.socials?.twitter
        ? { href: member.socials.twitter, label: "Twitter", icon: Twitter }
        : null,
      member.socials?.telegram
        ? { href: member.socials.telegram, label: "Telegram", icon: Send }
        : null,
    ].filter(Boolean) as Array<{
      href: string;
      label: string;
      icon: typeof Github;
    }>;

    return (
      <article className="card-shell group relative flex h-full flex-col overflow-hidden border border-border-main bg-surface">
        <button
          type="button"
          aria-label={text(`View ${member.name}`, `Xem ${member.name}`)}
          onClick={() => navigate(`/members/${member.id}`)}
          className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div
            className={`relative z-0 h-14 w-full ${
              intent === "primary" ? "bg-primary" : "bg-highlight"
            } bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiLz48L3N2Zz4=')]`}
          >
            <div className="absolute inset-0 bg-main-bg/10"></div>
          </div>

          <div className="absolute left-3.5 top-3 z-10">
            <div className="h-14 w-14 bg-surface p-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]">
              <img
                src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`}
                className="h-full w-full object-cover"
                alt={member.name}
              />
            </div>
          </div>

            <div className="absolute right-3 top-2.5 z-10 flex items-center gap-1.5 bg-surface/90 px-2 py-1 font-mono text-[8px] font-black uppercase text-text-main">
            <span
              className={`h-1.5 w-1.5 rounded-full ${member.is_active ? "bg-primary animate-pulse" : "bg-gray-400"}`}
            ></span>
            {isCommunityMember(member)
              ? text("Community", "Cộng đồng")
              : text("Core", "Nòng cốt")}
          </div>

          <div className="relative z-0 flex flex-1 flex-col gap-2.5 bg-surface px-3.5 pb-3.5 pt-6">
            <div className="space-y-0.5">
              <h3 className="break-words font-heading text-[15px] font-black leading-tight tracking-tight text-text-main">
                {member.name}
              </h3>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {translateMemberRole(member.role, text)}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="bg-main-bg px-1.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {member.is_active ? text("Live", "Đang hoạt động") : text("Idle", "Tạm nghỉ")}
              </span>
              <span className="bg-main-bg px-1.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {member.skills.length} {text("skills", "kỹ năng")}
              </span>
              {member.skills.slice(0, 1).map((skill) => (
                <span
                  key={skill}
                  className="bg-main-bg px-1.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-text-muted"
                >
                  {skill}
                </span>
              ))}
              {member.skills.length > 1 && (
                <span className="bg-main-bg px-1.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  +{member.skills.length - 1}
                </span>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-text-muted">
                <span>{text("View", "Xem")}</span>
                <ArrowRight size={12} />
              </div>
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-text-muted">
                #{member.id.substring(0, 4)}
              </span>
            </div>
          </div>
        </button>

        {socialLinks.length > 0 && (
          <div className="flex items-center justify-between gap-2 bg-main-bg/60 px-3.5 py-2">
            <div className="flex gap-1.5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={`${member.id}-${social.label}`}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-8 min-w-8 bg-main-bg p-1.5 text-text-muted transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={`${member.name} ${social.label}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>

            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-text-muted">
              {socialLinks.length} {text("links", "liên kết")}
            </span>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12 space-y-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tight text-text-main">
              {text("Members", "Thành viên")}
            </h1>
            <p className="mt-3 max-w-2xl text-xs font-mono uppercase tracking-widest text-gray-500">
              {text(
                "Browse the builders and learners in our community.",
                "Khám phá các builder và learner trong cộng đồng.",
              )}
            </p>
        </div>

        <div className="relative w-full shrink-0 lg:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={text(
              "Search by name or skill...",
              "Tìm theo tên hoặc kỹ năng...",
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface p-4 pl-12 font-mono text-xs font-bold uppercase tracking-widest placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-primary"></div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-tight text-text-main">
              {text("Official Members", "Thành viên chính thức")}
            </h2>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {officialMembers.length} {text("profiles", "hồ sơ")}
          </span>
        </div>
        {officialMembers.length > 0 ? (
          <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {officialMembers.map((member) => (
              <MemberCard key={member.id} member={member} intent="primary" />
            ))}
          </div>
        ) : (
          <div className="bg-surface p-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
            {text("No official members found.", "Không tìm thấy thành viên chính thức nào.")}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-primary"></div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-tight text-text-main">
              {text("Community", "Cộng đồng")}
            </h2>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {communityMembers.length} {text("profiles", "hồ sơ")}
          </span>
        </div>
        {communityMembers.length > 0 ? (
          <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {communityMembers.map((member) => (
              <MemberCard key={member.id} member={member} intent="primary" />
            ))}
          </div>
        ) : (
          <div className="bg-surface p-12 text-center text-text-muted font-mono uppercase text-xs tracking-widest">
            {text("No community members found.", "Không tìm thấy thành viên cộng đồng nào.")}
          </div>
        )}
      </section>
    </div>
  );
}
