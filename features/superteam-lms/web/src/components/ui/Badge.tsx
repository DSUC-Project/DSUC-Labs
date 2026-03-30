'use client';

import * as React from 'react';

type Variant = 'default' | 'neutral' | 'outline';

export function Badge({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
}) {
  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase';

  const variants: Record<Variant, string> = {
    default: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    neutral: 'bg-slate-800/50 text-slate-300 border border-slate-700/50',
    outline: 'bg-transparent text-slate-300 border border-slate-600/70',
  };

  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
}
