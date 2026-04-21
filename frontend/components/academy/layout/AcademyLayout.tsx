import React from 'react';

export function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="academy-scope relative rounded-2xl border border-white/10 bg-[#0f1220]/70 p-4 sm:p-6 md:p-8 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 academy-grid opacity-30" />

      <div className="relative z-10">{children}</div>
    </section>
  );
}
