import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ActionButton } from "@/components/ui/Primitives";
import { GlitchText } from "@/components/GlitchText";
import { useStore } from "@/store/useStore";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const MARQUEE_TEXT =
  "BUILD · LEARN · SHIP · SOLANA · WEB3 · CODE · COMMUNITY · DSUC LABS · ";

const FLOAT_TAGS = [
  { label: "Solana", className: "top-[8%] -left-3 rotate-[-6deg]", delay: 0 },
  { label: "Rust", className: "top-[28%] -right-4 rotate-[8deg]", delay: 0.4 },
  { label: "Builder", className: "bottom-[22%] -left-6 rotate-[4deg]", delay: 0.8 },
  { label: "Web3", className: "bottom-[6%] -right-2 rotate-[-5deg]", delay: 1.2 },
] as const;

function MarqueeStrip() {
  const shouldReduceMotion = useReducedMotion();
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const duration = isNarrow ? 40 : 25;
  const strip = (
    <>
      <span>
        {MARQUEE_TEXT}
        {MARQUEE_TEXT}
      </span>
      <span>
        {MARQUEE_TEXT}
        {MARQUEE_TEXT}
      </span>
    </>
  );

  return (
    <div
      className={cn(
        "home-marquee-mask group relative flex w-full items-center overflow-hidden bg-main-bg py-4 dark:bg-navy-surface",
      )}
    >
      {shouldReduceMotion ? (
        <div className="flex whitespace-nowrap font-display text-2xl font-bold uppercase tracking-widest text-primary">
          <span>
            {MARQUEE_TEXT}
            {MARQUEE_TEXT}
          </span>
        </div>
      ) : (
        <div
          className="home-marquee-track flex whitespace-nowrap font-display text-2xl font-bold uppercase tracking-widest text-primary will-change-transform"
          style={{ animationDuration: `${duration}s` }}
        >
          {strip}
        </div>
      )}
    </div>
  );
}

function CautionDivider() {
  return (
    <div
      className="home-caution-divider w-full"
      role="presentation"
      aria-hidden="true"
    />
  );
}

/** D13 — print-style crop marks at the four corners of a framed region */
function CropMarks({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-[5]", className)}
      aria-hidden="true"
    >
      <span className="home-crop home-crop-tl" />
      <span className="home-crop home-crop-tr" />
      <span className="home-crop home-crop-bl" />
      <span className="home-crop home-crop-br" />
    </div>
  );
}

/** D14 — editorial section index chip */
function SectionChip({
  index,
  label,
  className,
}: {
  index: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-[6] select-none border border-text-main/25 bg-surface/80 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-muted backdrop-blur-sm dark:border-text-main/20",
        className,
      )}
      aria-hidden="true"
    >
      {index} · {label}
    </span>
  );
}

function LiveBadge({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
      className="mb-8 inline-flex items-center gap-2 border-2 border-text-main bg-surface px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
    >
      <span className="home-live-dot relative flex h-2 w-2" aria-hidden="true">
        <span className="home-live-dot-ring absolute inset-0 rounded-full bg-primary" />
        <span className="relative h-2 w-2 rounded-full bg-primary" />
      </span>
      {label}
    </motion.div>
  );
}

export function Home() {
  const { text, isVIE } = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const { members, projects, events, bootstrapStatus } = useStore();

  const isDataLoading =
    bootstrapStatus === "loading" || bootstrapStatus === "slow";

  return (
    <div className="relative w-full">
      {/* D07 noise grain — one layer for whole Home */}
      <div className="home-grain" aria-hidden="true" />

      {/* HERO SECTION */}
      <section className="relative container mx-auto px-4 py-12 md:py-24">
        {/* D05 vignette + D06 soft orbs (clipped so blobs don't spill page) */}
        <div
          className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="home-hero-vignette absolute inset-0" />
          {!shouldReduceMotion && (
            <>
              <motion.div
                className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl md:h-72 md:w-72 dark:bg-primary/15"
                animate={{ y: [0, 14, 0], x: [0, 10, 0] }}
                transition={{
                  duration: 16,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -right-10 bottom-4 h-48 w-48 rounded-full bg-primary/10 blur-3xl md:h-64 md:w-64 dark:bg-primary/12"
                animate={{ y: [0, -12, 0], x: [0, -8, 0] }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2,
                }}
              />
            </>
          )}
        </div>

        {/* D13 crop marks + D14 section chip */}
        <CropMarks className="hidden sm:block" />
        <SectionChip
          index="01"
          label="HERO"
          className="-rotate-1 top-3 left-4 md:top-4 md:left-6"
        />

        <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* LEFT: Content */}
          <div className="order-1 z-10 flex flex-col items-start lg:col-span-6">
            <LiveBadge
              label={text("System Live", "Hệ thống đang hoạt động")}
            />

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`mb-8 font-display text-6xl font-black uppercase md:text-7xl lg:text-8xl ${
                isVIE
                  ? "tracking-tight leading-[0.98] md:leading-[0.92] lg:leading-[0.9]"
                  : "tracking-tighter leading-[0.85]"
              }`}
            >
              <span className="block">{isVIE ? "CHÚNG TÔI" : "WE"}</span>
              <span
                className={`block ${isVIE ? "mt-2.5 md:mt-3.5" : "mt-1.5 md:mt-2"}`}
              >
                <GlitchText
                  words={
                    isVIE
                      ? ["XÂY", "HỌC", "SHIP", "PHÁT TRIỂN"]
                      : ["BUILD", "LEARN", "SHIP", "GROWING"]
                  }
                  className="text-primary drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] motion-safe:transition-colors"
                />
              </span>
              <span
                className={`block ${isVIE ? "mt-2.5 md:mt-3.5" : "mt-1.5 md:mt-2"}`}
              >
                {isVIE ? "CÙNG NHAU." : "TOGETHER."}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-10 max-w-sm font-mono text-lg leading-relaxed text-text-muted md:text-xl"
            >
              {text(
                "A student builder operating system for learning code, running community, shipping projects, and growing DSUC.",
                "Một operating system dành cho student builder để học code, vận hành cộng đồng, ship dự án và phát triển DSUC.",
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex w-full flex-col gap-4 sm:flex-row"
            >
              <Link to="/academy" className="group w-full sm:w-auto">
                <ActionButton
                  variant="primary"
                  className="home-cta-shimmer inline-flex w-full items-center justify-center"
                >
                  {text("Start Learning", "Bắt đầu học")}
                  <ArrowRight
                    className="ml-2 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </ActionButton>
              </Link>
              <Link to="/projects" className="group w-full sm:w-auto">
                <ActionButton
                  variant="secondary"
                  className="inline-flex w-full items-center justify-center"
                >
                  {text("Explore Projects", "Khám phá dự án")}
                  <ArrowRight
                    className="ml-2 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </ActionButton>
              </Link>
            </motion.div>
          </div>

          {/* RIGHT: Terminal + floating tags */}
          <div className="relative order-2 z-10 ml-auto hidden h-full min-h-[480px] w-full max-w-[500px] flex-col justify-center lg:col-span-6 lg:flex">
            {/* D12 floating mono tags */}
            {!shouldReduceMotion &&
              FLOAT_TAGS.map((tag) => (
                <motion.span
                  key={tag.label}
                  className={cn(
                    "pointer-events-none absolute z-20 border border-text-main/40 bg-surface/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-main shadow-[2px_2px_0_0_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-text-main/30 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]",
                    tag.className,
                  )}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: tag.delay,
                  }}
                >
                  {tag.label}
                </motion.span>
              ))}

            <div className="flex h-full w-full -rotate-2 flex-col overflow-hidden border-[3px] border-text-main bg-surface shadow-[8px_8px_0_0_#000] transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:rotate-0 hover:shadow-[12px_12px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] dark:hover:shadow-[12px_12px_0_0_#fff]">
              {/* Terminal Bar */}
              <div className="flex items-center justify-between border-b-[3px] border-text-main bg-text-main px-4 py-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full border-2 border-main-bg bg-red-500" />
                  <div className="h-3 w-3 rounded-full border-2 border-main-bg bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full border-2 border-main-bg bg-emerald-500" />
                </div>
                <div className="flex items-center justify-center">
                  <span className="rounded bg-main-bg/20 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-main-bg">
                    dsuc_core.rs
                  </span>
                </div>
              </div>

              {/* Terminal Content */}
              <div className="relative flex flex-1 flex-row overflow-hidden bg-[#0B0F17] p-4 text-slate-300 sm:p-6">
                {/* D08 scanline */}
                <span className="home-scanline" aria-hidden="true" />

                {/* D19 hash watermark */}
                <span
                  className="pointer-events-none absolute bottom-3 left-3 z-[1] select-none font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-slate-600/40"
                  aria-hidden="true"
                >
                  0xDSUC · // labs
                </span>

                <div className="absolute top-2 right-4 z-[1] select-none font-mono text-[10px] text-slate-800 opacity-50">
                  RUST_ENV=prod
                </div>
                <div className="absolute right-4 bottom-2 z-[1] select-none font-mono text-[10px] text-slate-800 opacity-50">
                  cargo run --release
                </div>

                <div className="mr-4 flex select-none flex-col items-end border-r border-slate-800 pr-4 font-mono text-[9px] leading-[1.6] text-slate-600 sm:text-[10px]">
                  {[...Array(23)].map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                <div className="flex w-full select-none flex-col font-mono text-[9px] leading-[1.6] sm:text-[10px]">
                  <div>
                    <span className="font-bold text-pink-400">fn</span>{" "}
                    <span className="font-bold text-yellow-300">main</span>(){" "}
                    {"{"}
                  </div>
                  <div className="pl-4">
                    <span className="font-bold text-pink-400">let</span> key ={" "}
                    <span className="text-emerald-400">b&quot;DSUC&quot;</span>;
                  </div>
                  <div>&nbsp;</div>
                  <div className="pl-4">
                    <span className="font-bold text-pink-400">let</span>{" "}
                    encrypted = [
                  </div>
                  <div className="pl-8 tracking-wide text-slate-400">
                    10, 50, 56, 38, 100, 115, 117, 99, 100, 105, 117, 7, 17, 7,
                    117, 16,
                  </div>
                  <div className="pl-8 tracking-wide text-slate-400">
                    17, 3, 16, 17, 16, 22, 20, 14, 100, 6, 27, 10, 18, 22, 7, 16,
                  </div>
                  <div className="pl-8 tracking-wide text-slate-400">
                    13, 7, 12, 99, 7, 31, 0, 1, 78, 21, 58, 54, 42, 55, 48, 39,
                  </div>
                  <div className="pl-8 tracking-wide text-slate-400">
                    100, 115, 111, 99, 117, 106, 123, 115, 113, 125, 103, 115,
                    118, 102,
                  </div>
                  <div className="pl-8 tracking-wide text-slate-400">
                    95, 1, 43, 50, 39, 39, 100, 115, 117, 99, 126, 115, 15, 2,
                  </div>
                  <div className="pl-8 tracking-wide text-slate-400">
                    12, 115, 122, 99, 16, 27, 26, 7, 13, 6, 24, 99, 107, 115,
                  </div>
                  <div className="pl-8 tracking-wide text-slate-400">
                    31, 6, 22, 1, 12,
                  </div>
                  <div className="pl-4">];</div>
                  <div>&nbsp;</div>
                  <div className="pl-4">
                    <span className="font-bold text-pink-400">let</span> decoded:{" "}
                    <span className="text-emerald-300">String</span> = encrypted
                  </div>
                  <div className="pl-8 text-blue-300">.iter()</div>
                  <div className="pl-8 text-blue-300">.enumerate()</div>
                  <div className="pl-8 text-blue-300">
                    .map(|(i, b)| (b ^ key[i % key.len()]){" "}
                    <span className="font-bold text-pink-400">as</span>{" "}
                    <span className="text-emerald-300">char</span>)
                  </div>
                  <div className="pl-8 text-blue-300">.collect();</div>
                  <div>&nbsp;</div>
                  <div className="pl-4">
                    <span className="font-bold text-yellow-300">println!</span>(
                    <span className="text-emerald-400">
                      &quot;{"{"}
                      {"}"}&quot;
                    </span>
                    , decoded);
                  </div>
                  <div>{"}"}</div>
                  {/* D09 cursor blink */}
                  <div className="pl-0 pt-1">
                    <span className="home-terminal-cursor" aria-hidden="true">
                      ▌
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D15 caution micro-divider */}
      <CautionDivider />

      <div className="relative">
        <SectionChip
          index="02"
          label="SIGNAL"
          className="rotate-1 top-1 left-4 z-10 md:left-[max(1rem,calc((100%-80rem)/2+1.5rem))]"
        />
        <MarqueeStrip />
      </div>

      <CautionDivider />

      {/* System Overview Strip */}
      <section className="relative border-t border-b border-border-main bg-main-bg/50">
        <SectionChip
          index="03"
          label="STATS"
          className="-rotate-1 top-3 left-4 z-10 md:left-[max(1rem,calc((100%-80rem)/2+1.5rem))]"
        />
        <div className="container mx-auto">
          <div className="grid grid-cols-2 divide-y divide-border-main border-x border-border-main md:grid-cols-4 md:divide-y-0 md:divide-x">
            {[
              {
                label: text("Members", "Thành viên"),
                val: members.length,
                key: "members" as const,
              },
              {
                label: text("Projects", "Dự án"),
                val: projects.length,
                key: "projects" as const,
              },
              {
                label: text("Events", "Sự kiện"),
                val: events.length,
                key: "events" as const,
              },
              {
                label: text("Academy Units", "Academy Units"),
                val: 120,
                key: "academy" as const,
                fixed: true,
              },
            ].map((stat, i) => {
              const showSkeleton =
                isDataLoading && !stat.fixed && (stat.val as number) === 0;

              return (
                <div
                  key={stat.key}
                  className="flex flex-col items-center justify-center p-6 text-center md:p-8"
                >
                  {showSkeleton ? (
                    <div className="mb-2 h-10 w-16 bg-surface motion-safe:animate-pulse md:h-12 md:w-20" />
                  ) : (
                    <p className="mb-2 font-display text-4xl font-bold lg:text-5xl">
                      {stat.fixed ? stat.val : stat.val || "0"}
                    </p>
                  )}
                  {/* D16 label + underline draw on view */}
                  <div className="relative inline-flex flex-col items-center">
                    <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                      {stat.label}
                    </p>
                    <motion.span
                      className="mt-1.5 h-[2px] w-full origin-left bg-primary"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : {
                              duration: 0.45,
                              delay: 0.08 * i,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
