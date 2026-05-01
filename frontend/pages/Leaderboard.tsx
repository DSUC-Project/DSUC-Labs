import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Flame, Medal, Trophy } from 'lucide-react';

import {
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui/Primitives';
import { useStore } from '@/store/useStore';
import type { Member } from '@/types';

type RankedMember = Member & {
  rank: number;
  streakValue: number;
  buildsValue: number;
};

function getRankedMembers(members: Member[], currentUser: Member | null) {
  const source =
    currentUser && !members.some((member) => member.id === currentUser.id)
      ? [currentUser, ...members]
      : members;

  return source
    .map((member) => ({
      ...member,
      streakValue: Math.max(0, Number(member.streak || 0)),
      buildsValue: Math.max(0, Number(member.builds || 0)),
    }))
    .sort((left, right) => {
      if (right.streakValue !== left.streakValue) {
        return right.streakValue - left.streakValue;
      }
      return right.buildsValue - left.buildsValue;
    })
    .slice(0, 12)
    .map((member, index) => ({
      ...member,
      rank: index + 1,
    }));
}

export function Leaderboard() {
  const { members, currentUser } = useStore();
  const ranked = getRankedMembers(members, currentUser);
  const topThree = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHeader
        eyebrow="Leaderboard"
        title="Ranked by real learning streak."
        subtitle="The board prioritizes streak consistency, then build activity. It highlights the current user when present and keeps the rest of the list compact."
        actions={
          <>
            <StatusBadge tone="warning">Metric: streak days</StatusBadge>
            <StatusBadge tone="info">Top {ranked.length}</StatusBadge>
          </>
        }
      />

      {ranked.length === 0 ? (
        <EmptyState
          title="No ranking data yet"
          message="Once member profiles include learning activity, the leaderboard will surface the top streaks here."
        />
      ) : (
        <>
          <section className="space-y-5">
            <SectionHeader
              eyebrow="Podium"
              title="Top Performers"
              subtitle="Editorial podium cards for the current top three."
            />
            <div className="grid gap-5 lg:grid-cols-3">
              {topThree.map((member) => (
                <PodiumCard
                  key={member.id}
                  member={member}
                  isCurrentUser={currentUser?.id === member.id}
                />
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <SectionHeader
              eyebrow="Full Board"
              title="All Ranked Members"
              subtitle="Compact rows for the rest of the leaderboard."
            />
            <SurfaceCard className="overflow-hidden p-0">
              <div className="grid grid-cols-[72px_minmax(0,1.4fr)_120px_120px_140px] gap-4 border-b border-border-main bg-main-bg px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                <span>Rank</span>
                <span>Member</span>
                <span>Streak</span>
                <span>Builds</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-border-main">
                {rest.length > 0 ? (
                  rest.map((member) => (
                    <LeaderboardRow
                      key={member.id}
                      member={member}
                      isCurrentUser={currentUser?.id === member.id}
                    />
                  ))
                ) : (
                  <div className="px-5 py-10 text-sm text-text-muted">
                    Only the podium is populated right now.
                  </div>
                )}
              </div>
            </SurfaceCard>
          </section>
        </>
      )}
    </div>
  );
}

function PodiumCard({
  member,
  isCurrentUser,
}: {
  member: RankedMember;
  isCurrentUser: boolean;
}) {
  const tone =
    member.rank === 1
      ? 'bg-primary text-main-bg'
      : member.rank === 2
        ? 'bg-secondary-soft text-text-main'
        : 'bg-warning-soft text-text-main';

  const Icon = member.rank === 1 ? Crown : member.rank === 2 ? Trophy : Medal;
  const avatarSrc = member.avatar || `https://i.pravatar.cc/160?u=${member.id}`;

  return (
    <SurfaceCard interactive className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${tone}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="warning">Rank {member.rank}</StatusBadge>
          {isCurrentUser ? <StatusBadge tone="success">You</StatusBadge> : null}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-border-main bg-surface">
          <img src={avatarSrc} alt={member.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-heading text-2xl font-semibold tracking-tight text-text-main">
            {member.name}
          </h3>
          <p className="truncate text-sm text-text-muted">{member.role || 'Member'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <MetricCell label="Streak" value={`${member.streakValue} days`} />
        <MetricCell label="Builds" value={String(member.buildsValue)} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-main pt-5">
        <span className="text-xs uppercase tracking-[0.18em] text-text-muted">
          {member.academyRank || 'Active learner'}
        </span>
        <Link to={`/member/${member.id}`} className="action-button action-button-secondary">
          View Profile
        </Link>
      </div>
    </SurfaceCard>
  );
}

function LeaderboardRow({
  member,
  isCurrentUser,
}: {
  member: RankedMember;
  isCurrentUser: boolean;
}) {
  const avatarSrc = member.avatar || `https://i.pravatar.cc/120?u=${member.id}`;

  return (
    <Link
      to={`/member/${member.id}`}
      className={`grid grid-cols-[72px_minmax(0,1.4fr)_120px_120px_140px] gap-4 px-5 py-4 transition-colors hover:bg-main-bg ${
        isCurrentUser ? 'bg-secondary-soft/70' : ''
      }`}
    >
      <div className="font-heading text-2xl font-semibold text-text-main">{member.rank}</div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-[16px] border border-border-main bg-surface">
          <img src={avatarSrc} alt={member.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-main">{member.name}</p>
          <p className="truncate text-xs uppercase tracking-[0.16em] text-text-muted">
            {member.role || 'Member'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-text-main">
        <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
        {member.streakValue}
      </div>
      <div className="flex items-center text-sm text-text-main">{member.buildsValue}</div>
      <div className="flex items-center">
        <StatusBadge tone={isCurrentUser ? 'success' : 'default'}>
          {isCurrentUser ? 'Current User' : member.academyRank || 'Ranked'}
        </StatusBadge>
      </div>
    </Link>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border-main bg-main-bg p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-text-main">{value}</p>
    </div>
  );
}
