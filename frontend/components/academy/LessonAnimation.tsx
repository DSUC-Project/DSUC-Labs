import React from 'react';
import { Cpu, Database, Layers, Workflow } from 'lucide-react';

const LESSON_VISUAL: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
  'm1-blockchain-as-a-computer': {
    title: 'Client-Server vs P2P',
    subtitle: 'Shared state synchronization across validators',
    icon: <Workflow className="h-5 w-5 text-indigo-300" />,
  },
  'm2-identity-and-authentication': {
    title: 'Wallet Identity Flow',
    subtitle: 'Sign, verify, then execute',
    icon: <Cpu className="h-5 w-5 text-emerald-300" />,
  },
  'm3-consensus-input-not-memory': {
    title: 'Consensus Ordering',
    subtitle: 'Deterministic order leads to deterministic output',
    icon: <Layers className="h-5 w-5 text-cyan-300" />,
  },
  'm4-account-file': {
    title: 'Account Data Model',
    subtitle: 'Owner-controlled state with explicit reads/writes',
    icon: <Database className="h-5 w-5 text-amber-300" />,
  },
  'm5-program-library': {
    title: 'Program + PDA Pattern',
    subtitle: 'Stateless code with account-backed state',
    icon: <Database className="h-5 w-5 text-violet-300" />,
  },
  'm7-coding-with-claude': {
    title: 'Prompt Engineering Loop',
    subtitle: 'Context, constraints, checks, acceptance criteria',
    icon: <Workflow className="h-5 w-5 text-fuchsia-300" />,
  },
};

export default function LessonAnimation({ lessonId }: { lessonId: string }) {
  const content =
    LESSON_VISUAL[lessonId] ?? {
      title: 'Concept Map',
      subtitle: 'Structured mental model for this module',
      icon: <Cpu className="h-5 w-5 text-slate-300" />,
    };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-white/20 bg-slate-900/60 p-2">{content.icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-100">{content.title}</p>
          <p className="text-xs text-slate-400">{content.subtitle}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-2 rounded-full bg-indigo-400/70 animate-pulse" />
        <div className="h-2 rounded-full bg-cyan-400/70 animate-pulse" style={{ animationDelay: '120ms' }} />
        <div className="h-2 rounded-full bg-emerald-400/70 animate-pulse" style={{ animationDelay: '240ms' }} />
      </div>
    </div>
  );
}
