import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";
import { SoftBrutalCard } from "@/components/ui/Primitives";

// Baseline Card
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <SoftBrutalCard
    ref={ref}
    intent="default"
    className={cn(
      "flex flex-col relative transition-all",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

// Interactive Card
export const ActionCard = React.forwardRef<any, any>(
  ({ className, children, as = "button", ...props }, ref) => {
    const Component = as === "div" ? motion.div : motion.button;
    return (
      <Component
        ref={ref}
        className="w-full h-full focus:outline-none"
        {...props}
      >
        <SoftBrutalCard
          intent="primary"
          interactive
          className={cn(
            "flex flex-col items-start text-left relative transition-all group w-full h-full",
            className,
          )}
        >
          {children}
        </SoftBrutalCard>
      </Component>
    );
  },
);
ActionCard.displayName = "ActionCard";

// Stat Card
export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: any) => (
  <Card className={cn("p-6", className)}>
    <div className="flex justify-between items-start mb-4">
      <span className="font-mono text-xs uppercase text-text-muted">
        {title}
      </span>
      {Icon && <Icon className="w-4 h-4 text-primary" />}
    </div>
    <div className="flex items-end gap-3 mt-auto">
      <span className="font-heading text-4xl font-bold">{value}</span>
      {trend && (
        <span
          className={cn(
            "font-mono text-[10px] uppercase font-bold mb-1",
            trend.up ? "text-emerald-500" : "text-red-500",
          )}
        >
          {trend.label}
        </span>
      )}
    </div>
  </Card>
);

// We will add more variants if needed, or build them out of primitives in the respective files using Card.
