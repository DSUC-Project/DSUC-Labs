import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Github,
  Send,
  ShieldCheck,
  Sparkles,
  Twitter,
} from 'lucide-react';

import {
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui/Primitives';
import { useStore } from '@/store/useStore';
import type { Member } from '@/types';

function getMemberType(member: Member) {
  return member.memberType || member.member_type || 'community';
}

export function Members() {
  const { members } = useStore();
  const officialMembers = members.filter((member) => getMemberType(member) !== 'community');
  const communityMembers = members.filter((member) => getMemberType(member) === 'community');

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10">
      <PageHeader
        eyebrow="Members"
        title="The people behind DSUC Labs."
        subtitle="Profiles are split between official operators and the wider builder community, with quick access to skills, social presence, and profile routes."
        actions={
          <>
            <StatusBadge tone="info">{members.length} total</StatusBadge>
            <StatusBadge>{officialMembers.length} official</StatusBadge>
            <StatusBadge tone="warning">{communityMembers.length} community</StatusBadge>
          </>
        }
      />

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Official Lane"
          title="Official Members"
          subtitle="Club operators, leads, and active internal contributors."
        />
        {officialMembers.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {officialMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No official members loaded"
            message="The member directory is empty right now. Once the store finishes loading, official profiles will appear here."
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Community Lane"
          title="Community Members"
          subtitle="Learners, contributors, and external builders connected to the club."
        />
        {communityMembers.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {communityMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No community profiles yet"
            message="Community member cards will appear here when the store includes external learners and contributors."
          />
        )}
      </section>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const memberType = getMemberType(member);
  const isOfficial = memberType !== 'community';
  const avatarSrc = member.avatar || `https://i.pravatar.cc/160?u=${member.id}`;
  const socials = [
    { href: member.socials?.github, icon: Github, label: 'GitHub' },
    { href: member.socials?.twitter, icon: Twitter, label: 'Twitter' },
    { href: member.socials?.telegram, icon: Send, label: 'Telegram' },
    { href: member.socials?.facebook, icon: Facebook, label: 'Facebook' },
  ].filter((item) => !!item.href);

  return (
    <SurfaceCard interactive className="flex h-full flex-col p-6">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-border-main bg-warning-soft">
          <img src={avatarSrc} alt={member.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={isOfficial ? 'info' : 'warning'}>
              {isOfficial ? 'Official' : 'Community'}
            </StatusBadge>
            <StatusBadge>{member.role || (isOfficial ? 'Member' : 'Builder')}</StatusBadge>
          </div>
          <div>
            <h3 className="truncate font-heading text-2xl font-semibold tracking-tight text-text-main">
              {member.name}
            </h3>
            <p className="text-sm text-text-muted">
              {isOfficial ? 'Internal operating member' : 'External community participant'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-border-main bg-main-bg p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Skills</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {member.skills.length > 0 ? (
            member.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border-main bg-surface px-3 py-1 text-xs text-text-main"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm text-text-muted">No skills added yet.</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border-main pt-5">
        <div className="flex items-center gap-2">
          {socials.length > 0 ? (
            socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-button"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))
          ) : (
            <span className="text-xs uppercase tracking-[0.18em] text-text-muted">No socials</span>
          )}
        </div>
        <Link to={`/member/${member.id}`} className="action-button action-button-secondary">
          {isOfficial ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          View Profile
        </Link>
      </div>
    </SurfaceCard>
  );
}
