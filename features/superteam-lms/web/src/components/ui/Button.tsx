'use client';

import * as React from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes: Record<Size, string> = {
    sm: 'text-sm px-4 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-6 py-3',
  };

  const variants: Record<Variant, string> = {
    primary:
      'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10',
    secondary:
      'border border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-white hover:text-slate-900',
    outline:
      'border border-white/10 bg-transparent text-slate-300 hover:bg-white/5',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
