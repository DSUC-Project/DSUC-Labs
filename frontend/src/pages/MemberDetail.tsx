import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Facebook,
  Flame,
  Github,
  Globe,
  Link2,
  Send,
  Twitter,
} from "lucide-react";

import { useStore } from "../store/useStore";
import { Member } from "../types";
import { SoftBrutalCard, StatusBadge } from "@/components/ui/Primitives";
import { ModalShell } from "@/components/ui/ModalShell";
import { streakTheme } from "@/lib/streakTheme";

type PublicLink = {
  key: string;
  label: string;
  value: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

function normalizeUrl(
  value: string,
  kind: "github" | "twitter" | "telegram" | "facebook" | "portfolio",
) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const trimmed = value.replace(/^@/, "");

  switch (kind) {
    case "github":
      return `https://github.com/${trimmed}`;
    case "twitter":
      return `https://x.com/${trimmed}`;
    case "telegram":
      return `https://t.me/${trimmed}`;
    case "facebook":
      return `https://facebook.com/${trimmed}`;
    case "portfolio":
    default:
      return `https://${trimmed}`;
  }
}

function LinkRow({
  icon: Icon,
  label,
  href,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href: string;
  value: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 border border-border-main bg-main-bg px-4 py-3 text-text-main"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-surface text-text-main">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-text-main">{value}</div>
      </div>
    </a>
  );
}

function StreakCell({ active }: { active: boolean }) {
  return (
    <motion.div
      className={
        active
          ? `h-10 border ${streakTheme.dayBorder} ${streakTheme.daySolid}`
          : "h-10 border border-border-main bg-main-bg/65"
      }
      animate={active ? { opacity: [1, 0.88, 1] } : { opacity: [0.56, 0.72, 0.56] }}
      transition={{ duration: active ? 2.2 : 3.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members } = useStore();
  const [showContactPopup, setShowContactPopup] = useState(false);

  const matchedMember = members.find((entry) => entry.id === id);

  const member: Member = matchedMember || {
    id: id || "mock-id",
    name: `User ${id?.slice(0, 4) || "X"}`,
    avatar: `https://i.pravatar.cc/320?u=${id}`,
    role: "Member",
    skills: [],
    socials: {},
    memberType: "community",
  };

  const publicLinks = useMemo(
    () =>
      [
        member.socials?.github
          ? {
              key: "github",
              label: "GitHub",
              value: member.socials.github,
              href: normalizeUrl(member.socials.github, "github"),
              icon: Github,
            }
          : null,
        member.socials?.twitter
          ? {
              key: "twitter",
              label: "X",
              value: member.socials.twitter,
              href: normalizeUrl(member.socials.twitter, "twitter"),
              icon: Twitter,
            }
          : null,
        member.socials?.telegram
          ? {
              key: "telegram",
              label: "Telegram",
              value: member.socials.telegram,
              href: normalizeUrl(member.socials.telegram, "telegram"),
              icon: Send,
            }
          : null,
        member.socials?.facebook
          ? {
              key: "facebook",
              label: "Facebook",
              value: member.socials.facebook,
              href: normalizeUrl(member.socials.facebook, "facebook"),
              icon: Facebook,
            }
          : null,
        member.socials?.portfolio
          ? {
              key: "portfolio",
              label: "Portfolio",
              value: member.socials.portfolio,
              href: normalizeUrl(member.socials.portfolio, "portfolio"),
              icon: Globe,
            }
          : null,
      ].filter(Boolean) as PublicLink[],
    [member.socials],
  );

  const featuredSkills = member.skills.slice(0, 5);
  const summary = featuredSkills.length
    ? `Focused on ${featuredSkills.slice(0, 3).join(", ")}.`
    : "This member has not published focus areas yet.";
  const streakLength = Math.max(0, member.streak || 0);
  const streakPreview = Array.from({ length: 7 }, (_, index) =>
    index >= 7 - Math.min(streakLength, 7),
  );

  if (!matchedMember && members.length > 0) {
    return (
      <div className="pt-20 text-center font-mono text-sm uppercase tracking-widest text-text-muted">
        Member not found
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 md:py-16">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/members")}
          aria-label="Back to members"
          className="inline-flex h-10 w-10 items-center justify-center border-2 border-text-main bg-surface text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <ModalShell
        isOpen={showContactPopup}
        onClose={() => setShowContactPopup(false)}
        title="Contact"
        label="PUBLIC LINKS"
      >
        <div className="space-y-3">
          {publicLinks.length > 0 ? (
            publicLinks.map((link) => (
              <LinkRow
                key={link.key}
                icon={link.icon}
                label={link.label}
                href={link.href}
                value={link.value}
              />
            ))
          ) : (
            <div className="border border-dashed border-border-main bg-main-bg/60 px-4 py-4 text-sm leading-6 text-text-muted">
              No public links shared yet.
            </div>
          )}
        </div>
      </ModalShell>

      <SoftBrutalCard intent="primary" className="p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 gap-4 sm:gap-5">
            <div className="h-32 w-32 shrink-0 border-[3px] border-text-main bg-surface p-1.5 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.55)] sm:h-40 sm:w-40">
              <div className="h-full w-full overflow-hidden border border-border-main bg-main-bg">
                <img
                  src={member.avatar || `https://i.pravatar.cc/320?u=${member.id}`}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between py-1 sm:min-h-[160px]">
              <div className="space-y-2">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="break-words font-display text-[clamp(2rem,4.5vw,4.4rem)] font-black uppercase leading-[0.88] tracking-tight text-text-main"
                >
                  {member.name}
                </motion.h1>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  {member.role || "Member"}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={
                      member.memberType === "community" ? "Community" : "Official"
                    }
                  />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                    {publicLinks.length} public links
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
                  {summary}
                </p>

                {featuredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {featuredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:self-end lg:justify-end">
            {publicLinks.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="inline-flex h-11 w-11 items-center justify-center border border-border-main bg-surface text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}

            {publicLinks.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowContactPopup(true)}
                className="inline-flex h-11 items-center justify-center gap-2 border border-text-main bg-surface px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Link2 className="h-4 w-4" />
                Contact
              </button>
            ) : null}
          </div>
        </div>
      </SoftBrutalCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <SoftBrutalCard intent="default" className="p-6">
          <div className="mb-5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Connect
            </div>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-text-main">
              Public Links
            </h2>
          </div>

          <div className="space-y-3">
            {publicLinks.length > 0 ? (
              publicLinks.map((link) => (
                <LinkRow
                  key={link.key}
                  icon={link.icon}
                  label={link.label}
                  href={link.href}
                  value={link.value}
                />
              ))
            ) : (
              <div className="border border-dashed border-border-main bg-main-bg/60 px-4 py-4 text-sm leading-6 text-text-muted">
                No public links shared yet.
              </div>
            )}
          </div>
        </SoftBrutalCard>

        <SoftBrutalCard intent="default" className="p-6">
          <div className="mb-5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Learning
            </div>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-text-main">
              Streak
            </h2>
          </div>

          <div className="border border-border-main bg-main-bg/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Academy streak
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center border ${streakTheme.flameBorder} ${streakTheme.flameSoft}`}>
                    <Flame className={`h-6 w-6 ${streakTheme.flame}`} />
                  </div>
                  <div>
                    <div className="font-display text-5xl font-black leading-none tracking-tight text-text-main">
                      {streakLength}
                    </div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                      day run
                    </div>
                  </div>
                </div>
              </div>
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {streakLength > 0 ? "Active" : "Ready"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {streakPreview.map((active, index) => (
                <StreakCell key={`streak-preview-${index}`} active={active} />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-surface px-3 py-3">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Skills
                </div>
                <div className="mt-1 font-display text-2xl font-black text-text-main">
                  {member.skills.length}
                </div>
              </div>
              <div className="bg-surface px-3 py-3">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Links
                </div>
                <div className="mt-1 font-display text-2xl font-black text-text-main">
                  {publicLinks.length}
                </div>
              </div>
              <div className="bg-surface px-3 py-3">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Focus
                </div>
                <div className="mt-1 text-sm font-bold uppercase tracking-wide text-text-main">
                  {featuredSkills[0] || "Open"}
                </div>
              </div>
            </div>
          </div>
        </SoftBrutalCard>
      </div>
    </div>
  );
}
