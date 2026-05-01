import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FolderGit2,
  GraduationCap,
  Mail,
  Users,
} from 'lucide-react';

import { useContactModal, useShellActions } from '@/components/Layout';
import { ActionButton, PageHeader, SurfaceCard } from '@/components/ui/Primitives';
import { useStore } from '@/store/useStore';

function MarqueeStrip() {
  const shouldReduceMotion = useReducedMotion();
  const content = 'BUILD · LEARN · SHIP · SOLANA · WEB3 · CODE · COMMUNITY · DSUC LABS · ';

  return (
    <div className="overflow-hidden rounded-[28px] border border-border-main bg-surface-elevated py-4 shadow-neo-sm">
      <motion.div
        className="flex whitespace-nowrap font-mono text-xs uppercase tracking-[0.28em] text-text-muted"
        animate={shouldReduceMotion ? undefined : { x: ['0%', '-50%'] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { repeat: Infinity, duration: 24, ease: 'linear' }
        }
      >
        <span>{content.repeat(2)}</span>
        <span>{content.repeat(2)}</span>
      </motion.div>
    </div>
  );
}

export function Dashboard() {
  const { openContactModal } = useContactModal();
  const { openAuthModal } = useShellActions();
  const { backendStatus, events, members, projects, currentUser } = useStore();

  const nextEvent = useMemo(() => {
    return [...events]
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
      .find((event) => new Date(event.date).getTime() >= Date.now()) || events[0] || null;
  }, [events]);

  const statusLabel =
    backendStatus === 'online'
      ? 'ONLINE'
      : backendStatus === 'connecting'
        ? 'WARMING'
        : 'OFFLINE';

  const metrics = [
    { label: 'Members', value: String(members.length || 0) },
    { label: 'Projects', value: String(projects.length || 0) },
    { label: 'Events', value: String(events.length || 0) },
    { label: 'Academy', value: 'Curated + Community' },
  ];

  const quickLinks = [
    {
      title: 'Academy',
      description: 'Follow curated Solana paths and community lessons.',
      href: '/academy',
      icon: GraduationCap,
    },
    {
      title: 'Projects',
      description: 'Review active DSUC builds and product directions.',
      href: '/projects',
      icon: FolderGit2,
    },
    {
      title: 'Events',
      description: 'Track workshops, meetups, and upcoming sessions.',
      href: '/events',
      icon: Calendar,
    },
    {
      title: 'Members',
      description: 'Meet the club members and community builders.',
      href: '/members',
      icon: Users,
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 pb-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,460px)] lg:items-stretch">
        <div className="space-y-8">
          <PageHeader
            eyebrow="DSUC Labs"
            title="Build With The Club That Learns In Public."
            subtitle="DSUC Labs is the operating system for the DUT Superteam University Club: a place to learn Solana, ship projects, and run the community with real workflow tools."
            actions={
              <>
                <Link to="/academy">
                  <ActionButton>Start Learning</ActionButton>
                </Link>
                <Link to="/projects">
                  <ActionButton variant="secondary">Explore Projects</ActionButton>
                </Link>
                <ActionButton variant="ghost" onClick={openContactModal}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Contact DSUC
                </ActionButton>
              </>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <SurfaceCard key={metric.label} className="p-5">
                <p className="section-eyebrow">{metric.label}</p>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-text-main">
                  {metric.value}
                </p>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <SurfaceCard className="overflow-hidden p-0">
          <div className="border-b border-border-main bg-main-bg px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff8d7d]" />
              <span className="h-3 w-3 rounded-full bg-[#f7cf46]" />
              <span className="h-3 w-3 rounded-full bg-[#53c792]" />
              <p className="ml-auto font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
                dsuc/system
              </p>
            </div>
          </div>
          <div className="space-y-7 bg-[#0d1624] px-5 py-6 font-mono text-sm text-[#d9e4ff]">
            <div className="space-y-2">
              <p className="text-[#6aa6ff]">$ dsuc status</p>
              <div className="space-y-1 pl-4 text-[#c4d2ee]">
                <p>
                  system ........{' '}
                  <span className={backendStatus === 'online' ? 'text-[#53c792]' : backendStatus === 'offline' ? 'text-[#ff8d7d]' : 'text-[#f7cf46]'}>
                    {statusLabel}
                  </span>
                </p>
                <p>mode .......... {currentUser ? 'AUTHENTICATED' : 'GUEST PREVIEW'}</p>
                <p>academy ....... CURATED + COMMUNITY</p>
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#8fa6cf]">
                Featured Learning Path
              </p>
              <h3 className="font-heading text-xl font-semibold tracking-tight text-white">
                Solana Core Builder Roadmap
              </h3>
              <p className="text-sm leading-6 text-[#bfd0f2]">
                Start with wallet fundamentals, move through transactions and program patterns,
                then finish with hands-on challenge labs.
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[42%] rounded-full bg-[#f7cf46]" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#8fa6cf]">
                3 courses • structured progression
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8fa6cf]">
                  Next Event
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {nextEvent?.title || 'Upcoming session to be announced'}
                </p>
                <p className="mt-1 text-sm text-[#bfd0f2]">
                  {nextEvent ? `${nextEvent.date} • ${nextEvent.time || 'TBA'}` : 'Watch the Events board for updates.'}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8fa6cf]">
                  Current Snapshot
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {members.length} builders • {projects.length} active builds
                </p>
                <p className="mt-1 text-sm text-[#bfd0f2]">
                  Community activity, learning, and shipping in one place.
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <MarqueeStrip />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)]">
        <SurfaceCard className="p-6 md:p-8">
          <p className="section-eyebrow">Featured Highlight</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text-main">
            {nextEvent ? nextEvent.title : 'Academy Builder Environment'}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-muted">
            {nextEvent
              ? `${nextEvent.type} scheduled for ${nextEvent.date}${nextEvent.time ? ` at ${nextEvent.time}` : ''}. Use Events to register and track the full DSUC calendar.`
              : 'The Academy is the core product surface: structured paths, community tracks, and challenge units designed to make Solana practice feel like real work.'}
          </p>
          <div className="mt-6">
            <Link to={nextEvent ? '/events' : '/academy'}>
              <ActionButton variant="secondary">
                {nextEvent ? 'Open Event Schedule' : 'Open Academy'}
              </ActionButton>
            </Link>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {quickLinks.map((item) => (
            <Link key={item.title} to={item.href}>
              <SurfaceCard interactive className="h-full p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-main bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-xl font-semibold tracking-tight text-text-main">
                        {item.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    </div>
                    <p className="text-sm leading-6 text-text-muted">{item.description}</p>
                  </div>
                </div>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      </section>

      <SurfaceCard className="p-8 text-center md:p-10">
        <p className="section-eyebrow">Final CTA</p>
        <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text-main">
          Move from reading about Solana to shipping with a real club workflow.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-text-muted">
          Start in the Academy, follow the Projects board, and use the rest of the workspace when you need it.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/academy">
            <ActionButton>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Start Learning
            </ActionButton>
          </Link>
          {currentUser ? (
            <Link to="/projects">
              <ActionButton variant="secondary">Explore Projects</ActionButton>
            </Link>
          ) : (
            <ActionButton variant="secondary" onClick={() => openAuthModal('login')}>
              Login / Connect
            </ActionButton>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
