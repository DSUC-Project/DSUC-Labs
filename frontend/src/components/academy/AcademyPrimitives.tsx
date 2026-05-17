import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type AcademyTone = "default" | "primary" | "success" | "warning" | "muted";

const badgeToneMap: Record<AcademyTone, string> = {
  default: "bg-main-bg text-text-main",
  primary: "bg-primary text-primary-foreground",
  success:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  warning:
    "bg-amber-400/30 text-amber-900 dark:text-amber-200",
  muted: "bg-surface text-text-main",
};

const panelToneMap: Record<AcademyTone, string> = {
  default: "border-border-main",
  primary: "border-primary/30",
  success: "border-emerald-500/30",
  warning: "border-amber-500/30",
  muted: "border-border-main",
};

const stripToneMap: Record<AcademyTone, string> = {
  default: "bg-transparent",
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  muted: "bg-text-muted",
};

export function AcademyPage({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "container mx-auto space-y-16 px-4 py-10 md:space-y-24 md:py-16",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AcademyBackLink({
  to,
  label,
  className,
}: {
  to: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 border-2 border-text-main bg-surface px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </Link>
  );
}

export function AcademyBadge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: AcademyTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest",
        badgeToneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AcademyPanel({
  children,
  className,
  tone = "default",
  interactive = false,
  padding = "p-6 sm:p-7",
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: AcademyTone;
  interactive?: boolean;
  padding?: string;
}) {
  return (
    <div
      className={cn(
        "card-shell relative overflow-hidden border bg-surface p-0 shadow-sm transition-all duration-300",
        panelToneMap[tone],
        interactive &&
          "cursor-pointer hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.55)]",
        !interactive && "shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1",
          stripToneMap[tone],
        )}
      />
      <div className={cn("relative z-10", padding)}>{children}</div>
    </div>
  );
}

export function AcademySectionTitle({
  title,
  description,
  eyebrow,
  action,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {eyebrow ? (
        <div className="mb-3 flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <span className="h-2.5 w-2.5 bg-primary" />
          {eyebrow}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function AcademyStat({
  label,
  value,
  meta,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "border border-border-main bg-main-bg/70 px-4 py-4 shadow-sm",
        className,
      )}
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-3xl font-black uppercase tracking-tighter text-text-main sm:text-4xl",
          valueClassName,
        )}
      >
        {value}
      </div>
      {meta ? (
        <div className="mt-2 font-mono text-[11px] leading-relaxed text-text-muted">
          {meta}
        </div>
      ) : null}
    </div>
  );
}

export function AcademyCompactStat({
  label,
  value,
  meta,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "border border-border-main bg-main-bg/70 px-4 py-3 shadow-sm",
        className,
      )}
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-2xl font-black uppercase tracking-tight text-text-main",
          valueClassName,
        )}
      >
        {value}
      </div>
      {meta ? (
        <div className="mt-1 font-mono text-[10px] leading-relaxed text-text-muted">
          {meta}
        </div>
      ) : null}
    </div>
  );
}

export function AcademyProgressBar({
  value,
  className,
  fillClassName,
}: {
  value: number;
  className?: string;
  fillClassName?: string;
}) {
  const width = `${Math.max(0, Math.min(100, Math.round(value)))}%`;
  return (
    <div
      className={cn(
        "relative h-2 overflow-hidden border border-text-main bg-main-bg",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-out",
          fillClassName,
        )}
        style={{ width }}
      />
    </div>
  );
}

export function AcademyEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <AcademyPanel className={cn("text-center", className)} padding="p-10 sm:p-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-text-muted">
          Academy
        </div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-text-main sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-md font-mono text-sm leading-relaxed text-text-muted">
          {description}
        </p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </AcademyPanel>
  );
}
