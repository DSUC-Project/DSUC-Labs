import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

// PRIMITIVES

export const PaperPanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("bg-surface border border-border-main p-8 shadow-sm", className)}
      {...props}
    />
  );
});
PaperPanel.displayName = "PaperPanel";

interface SoftBrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intent?: "default" | "primary" | "accent" | "success" | "danger" | "info" | "locked" | "warning";
  interactive?: boolean;
  withPattern?: boolean;
}

export const SoftBrutalCard = React.forwardRef<HTMLDivElement, SoftBrutalCardProps>(
  ({ className, intent = "default", interactive = false, withPattern = false, children, ...props }, ref) => {
    
    const baseColors = {
      default: "border-border-main hover:border-primary/50",
      primary: "border-primary/30 hover:border-primary",
      accent: "border-accent/30 hover:border-accent",
      success: "border-emerald-500/30 hover:border-emerald-500",
      danger: "border-red-500/30 hover:border-red-500",
      info: "border-cyan-500/30 hover:border-cyan-500",
      warning: "border-orange-500/30 hover:border-orange-500",
      locked: " border-border-main opacity-75 backdrop-grayscale",
    };

    const stripColors = {
      default: "bg-transparent",
      primary: "bg-primary",
      accent: "bg-accent",
      success: "bg-emerald-500",
      danger: "bg-red-500",
      info: "bg-cyan-500",
      warning: "bg-orange-500",
      locked: "bg-gray-400",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-surface border border-border-main p-6 overflow-hidden relative group transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,255,255,1)]",
          interactive ? "cursor-pointer focus:outline-none" : "shadow-sm",
          baseColors[intent],
          className
        )}
        {...(props as any)}
      >
        {/* Top Accent Strip */}
        {intent !== "default" && (
           <div className={cn("absolute top-0 left-0 w-full h-1", stripColors[intent])} />
        )}
        
        {/* Optional Micro Pattern background */}
        {withPattern && (
          <div className="absolute inset-0 bg-[radial-gradient(var(--text-main)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-300" />
        )}
        
        {/* Content */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      </motion.div>
    );
  }
);
SoftBrutalCard.displayName = "SoftBrutalCard";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
}
export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(({ className, variant = "primary", ...props }, ref) => {
  const base =
    "px-6 py-2.5 font-bold uppercase tracking-widest text-xs transition-all  active:translate-y-[2px]";
  let variants = {
    primary:
      "bg-primary text-primary-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,255,255,1)] border-2 border-text-main",
    secondary:
      "bg-surface text-text-main shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,255,255,1)] border-2 border-text-main",
    danger: "bg-red-500 text-white shadow-sm hover:shadow-md hover:bg-red-600 border-2 border-text-main",
    success:
      "bg-emerald-500 text-white shadow-sm hover:shadow-md hover:bg-emerald-600 border-2 border-text-main",
  };
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
});
ActionButton.displayName = "ActionButton";

export const StatusBadge = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 border border-border-main font-mono text-[10px] font-bold uppercase tracking-widest bg-main-bg text-text-main shadow-sm",
        className,
      )}
    >
      {status}
    </span>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  number?: string;
  showNumber?: boolean; // NEW — default false
  className?: string;
}

export const SectionHeader = ({
  title,
  showNumber = false,
  number,
  subtitle,
  className,
}: SectionHeaderProps) => (
  <div
    className={cn(
      "mb-8 flex items-end gap-6",
      className,
    )}
  >
    {showNumber && number && (
      <span className="font-heading text-4xl font-bold text-gray-200">
        {number}
      </span>
    )}
    <div>
      <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tighter text-text-main">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-3">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);
