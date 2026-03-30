'use client';

import * as React from 'react';

export function Card({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}) {
  const base =
    'rounded-3xl border border-white/10 bg-[#151725]/70 backdrop-blur-xl shadow-2xl shadow-black/30 p-5 sm:p-6';

  const hover = hoverEffect
    ? 'cursor-pointer transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-black/50'
    : '';

  return (
    <div onClick={onClick} className={`${base} ${hover} ${className}`}>
      {children}
    </div>
  );
}
