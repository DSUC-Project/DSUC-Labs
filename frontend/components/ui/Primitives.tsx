import React from 'react';
import { Inbox, Lock, LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export const PaperPanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('paper-panel', className)} {...props} />;
});
PaperPanel.displayName = 'PaperPanel';

export const SurfaceCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
  }
>(({ className, interactive = false, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      whileHover={interactive ? { y: -3 } : undefined}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn('surface-card', interactive && 'surface-card-interactive', className)}
      {...(props as any)}
    />
  );
});
SurfaceCard.displayName = 'SurfaceCard';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
    loading?: boolean;
  }
>(({ className, variant = 'primary', fullWidth, loading, children, disabled, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'action-button',
        `action-button-${variant}`,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});
ActionButton.displayName = 'ActionButton';

export function StatusBadge({
  children,
  className,
  tone = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}) {
  return (
    <span className={cn('status-badge', `status-badge-${tone}`, className)}>
      {children}
    </span>
  );
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('page-header', className)}>
      <div className="space-y-3">
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  className,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <PaperPanel className={cn('py-12 text-center', className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-text-main">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">{message}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </PaperPanel>
  );
}

export function PermissionCard({
  title,
  message,
  action,
  className,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <PaperPanel className={cn('permission-card', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-primary">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-main">{title}</h3>
        <p className="max-w-xl text-sm leading-6 text-text-muted">{message}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </PaperPanel>
  );
}

export function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return <div className={cn('skeleton-block', className)} aria-hidden="true" />;
}
