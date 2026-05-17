import React from "react";
import { ExternalLink } from "lucide-react";
import { SoftBrutalCard } from "@/components/ui/Primitives";
import { cn } from "@/lib/utils";

interface ShowcaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  category?: string | null;
  accentLabel?: string | null;
  description?: string | null;
  tags?: string[];
  footerLabel?: string;
  footerValue?: React.ReactNode;
  footerAside?: React.ReactNode;
}

export const ShowcaseCard = React.forwardRef<
  HTMLDivElement,
  ShowcaseCardProps
>(
  (
    {
      className,
      icon,
      title,
      category,
      accentLabel,
      description,
      tags = [],
      footerLabel,
      footerValue,
      footerAside,
      ...props
    },
    ref,
  ) => {
    const tagList = tags.filter(Boolean);
    const visibleTags = tagList.slice(0, 4);
    const extraTagCount = Math.max(tagList.length - visibleTags.length, 0);

    return (
      <SoftBrutalCard
        ref={ref}
        intent="primary"
        interactive
        className={cn("flex h-full flex-col p-6", className)}
        {...props}
      >
        <div className="absolute right-0 top-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>

        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            {icon}
          </div>

          <div className="min-w-0 pt-1">
            <h3 className="pr-6 font-heading text-lg font-bold leading-tight tracking-tight transition-colors group-hover:text-primary">
              {title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="border border-border-main bg-main-bg px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-text-muted">
                {category || "General"}
              </span>

              {accentLabel ? (
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary">
                  {accentLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mb-6 flex-grow font-mono text-sm leading-relaxed text-text-muted line-clamp-3">
          {description || "No description provided."}
        </p>

        <div className="mt-auto space-y-3 pt-4">
          {visibleTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-main-bg px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted"
                >
                  {tag}
                </span>
              ))}

              {extraTagCount > 0 ? (
                <span className="bg-main-bg px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  +{extraTagCount}
                </span>
              ) : null}
            </div>
          ) : null}

          {footerLabel || footerValue || footerAside ? (
            <div className="flex items-start justify-between gap-3 pt-3">
              <div className="min-w-0 flex-1">
                {footerLabel ? (
                  <span className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-text-muted">
                    {footerLabel}
                  </span>
                ) : null}

                {footerValue ? (
                  <div className="block break-words text-xs font-bold leading-relaxed text-text-main transition-colors group-hover:text-primary">
                    {footerValue}
                  </div>
                ) : null}
              </div>

              {footerAside ? (
                <div className="flex items-center gap-2 pt-0.5 text-text-muted">
                  {footerAside}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </SoftBrutalCard>
    );
  },
);

ShowcaseCard.displayName = "ShowcaseCard";
