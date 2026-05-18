import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { SoftBrutalCard } from "@/components/ui/Primitives";
import { cn } from "@/lib/utils";

export const adminInputClass =
  "h-11 w-full border border-border-main bg-main-bg px-3 font-mono text-xs font-bold tracking-[0.08em] text-text-main placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export const adminTextareaClass =
  "min-h-[136px] w-full border border-border-main bg-main-bg px-3 py-3 font-mono text-xs leading-6 tracking-[0.04em] text-text-main placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export const adminSelectClass = cn(adminInputClass, "appearance-none pr-8");

export const adminCheckboxClass =
  "h-4 w-4 border border-border-main bg-main-bg text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function AdminHero({
  eyebrow,
  title,
  subtitle,
  actions,
  metrics,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  metrics: React.ReactNode;
}) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
            {eyebrow}
          </div>
          <h1 className="font-heading text-4xl font-black uppercase tracking-tight text-text-main md:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl font-mono text-xs uppercase tracking-[0.18em] text-text-muted md:text-sm">
            {subtitle}
          </p>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics}
      </div>
    </section>
  );
}

export function AdminMetricCard({
  label,
  value,
  meta,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "accent" | "success" | "warning" | "danger";
}) {
  return (
    <SoftBrutalCard
      intent={tone}
      className="h-full p-5 hover:translate-x-0 hover:translate-y-0 hover:shadow-sm dark:hover:shadow-sm"
      withPattern
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {label}
          </div>
          <div className="font-heading text-3xl font-black uppercase leading-none tracking-tight text-text-main">
            {value}
          </div>
          {meta ? (
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              {meta}
            </div>
          ) : null}
        </div>

        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center border border-border-main bg-main-bg text-text-main">
            {icon}
          </div>
        ) : null}
      </div>
    </SoftBrutalCard>
  );
}

export function AdminTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex h-11 items-center gap-2 border px-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "border-text-main bg-primary text-primary-foreground"
                  : "border-border-main bg-surface text-text-main hover:bg-main-bg",
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined ? (
                <span
                  className={cn(
                    "inline-flex min-w-7 items-center justify-center px-1.5 py-0.5 text-[9px]",
                    isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-main-bg text-text-muted",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminPanel({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "primary" | "accent" | "success" | "warning" | "danger";
}) {
  return (
    <SoftBrutalCard
      intent={tone}
      className={cn(
        "p-5 hover:translate-x-0 hover:translate-y-0 hover:shadow-sm dark:hover:shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-text-main md:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-2xl font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>

      {children}
    </SoftBrutalCard>
  );
}

export function AdminField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          {label}
        </span>
        {hint ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

export function AdminToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 border border-border-main bg-main-bg px-3 py-3">
      <input
        type="checkbox"
        className={adminCheckboxClass}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-main">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-border-main bg-main-bg/60 px-5 py-8 text-center">
      <div className="font-heading text-xl font-black uppercase tracking-tight text-text-main">
        {title}
      </div>
      <p className="mx-auto mt-3 max-w-xl font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AdminNotice({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={cn(
        "border px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]",
        tone === "error"
          ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      )}
    >
      {message}
    </div>
  );
}

export function AdminListButton({
  title,
  meta,
  badges,
  active,
  onClick,
  aside,
}: {
  title: string;
  meta?: React.ReactNode;
  badges?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  aside?: React.ReactNode;
}) {
  const content = (
    <div
      className={cn(
        "w-full border px-4 py-3 text-left transition-colors",
        active
          ? "border-text-main bg-primary text-primary-foreground"
          : "border-border-main bg-main-bg hover:bg-surface text-text-main",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-base font-black uppercase tracking-tight">
            {title}
          </div>
          {meta ? (
            <div
              className={cn(
                "mt-2 font-mono text-[10px] uppercase tracking-[0.16em]",
                active ? "text-primary-foreground/80" : "text-text-muted",
              )}
            >
              {meta}
            </div>
          ) : null}
          {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
        </div>

        <div
          className={cn(
            "mt-0.5 flex shrink-0 items-center gap-2",
            active ? "text-primary-foreground" : "text-text-muted",
          )}
        >
          {aside}
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {content}
    </button>
  );
}

export function AdminPageSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
