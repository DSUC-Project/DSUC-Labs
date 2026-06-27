import React from "react";
import { motion } from "motion/react";
import { Activity, CloudCog, Server } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingTone = "connecting" | "warming" | "loading" | "offline";

function getTone(message: string): LoadingTone {
  const text = message.toLowerCase();

  if (text.includes("offline") || text.includes("retrying")) {
    return "offline";
  }
  if (text.includes("waking up") || text.includes("warm")) {
    return "warming";
  }
  if (text.includes("loading live data")) {
    return "loading";
  }
  return "connecting";
}

const toneConfig: Record<
  LoadingTone,
  {
    icon: typeof Server;
    label: string;
    accent: string;
    iconTone: string;
    frame: string;
  }
> = {
  connecting: {
    icon: CloudCog,
    label: "Connecting to backend",
    accent: "bg-sky-500",
    iconTone: "text-sky-600 dark:text-sky-400",
    frame: "border-sky-500/30",
  },
  warming: {
    icon: Server,
    label: "Warming service",
    accent: "bg-amber-500",
    iconTone: "text-amber-600 dark:text-amber-400",
    frame: "border-amber-500/30",
  },
  loading: {
    icon: Activity,
    label: "Fetching live data",
    accent: "bg-emerald-500",
    iconTone: "text-emerald-600 dark:text-emerald-400",
    frame: "border-emerald-500/30",
  },
  offline: {
    icon: CloudCog,
    label: "Retrying connection",
    accent: "bg-rose-500",
    iconTone: "text-rose-600 dark:text-rose-400",
    frame: "border-rose-500/30",
  },
};

export function LoadingScreen({
  message = "Loading DSUC Labs...",
}: {
  message?: string;
}) {
  const tone = getTone(message);
  const { icon: Icon, label, accent, iconTone, frame } = toneConfig[tone];

  return (
    <div className="fixed inset-0 z-50 bg-main-bg text-text-main">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_24%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.015),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40 dark:opacity-20" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div
          className={cn(
            "w-full max-w-xl border bg-surface/95 p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] backdrop-blur-sm md:p-8",
            frame,
          )}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-border-main bg-main-bg">
              <Icon className={cn("h-6 w-6", iconTone)} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-text-muted">
                {label}
              </p>
              <h1 className="mt-2 break-words font-heading text-2xl font-black uppercase leading-tight md:text-3xl">
                {message}
              </h1>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-2 overflow-hidden border border-border-main bg-main-bg">
              <motion.div
                className={cn("h-full w-1/2", accent)}
                animate={{ x: ["-20%", "120%"] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-text-muted">
              <span className={cn("h-2 w-2", accent)} />
              <span>Waiting for live backend data</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-border-main pt-5 text-xs text-text-muted md:grid-cols-3">
            <div className="space-y-1">
              <p className="font-mono font-bold uppercase tracking-[0.18em]">
                Step 1
              </p>
              <p>Wake the service</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono font-bold uppercase tracking-[0.18em]">
                Step 2
              </p>
              <p>Verify session</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono font-bold uppercase tracking-[0.18em]">
                Step 3
              </p>
              <p>Load live records</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
