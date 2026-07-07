import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ActionButton, SoftBrutalCard, StatusBadge, SectionHeader } from "@/components/ui/Primitives";
import { GlitchText } from "@/components/GlitchText";
import { useStore } from "@/store/useStore";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";

function MarqueeStrip() {
  const text =
    "BUILD · LEARN · SHIP · SOLANA · WEB3 · CODE · COMMUNITY · DSUC LABS · ";
  const shouldReduceMotion = useReducedMotion();
  const isMobile = window.innerWidth < 768;
  const noAnimation = shouldReduceMotion || isMobile;

  return (
    <div className="w-full relative overflow-hidden py-4  bg-main-bg dark:bg-navy-surface flex items-center">
      <motion.div
        className="flex whitespace-nowrap font-display uppercase font-bold text-2xl tracking-widest text-primary"
        animate={noAnimation ? {} : { x: ["0%", "-50%"] }}
        transition={
          noAnimation ? {} : { repeat: Infinity, duration: 25, ease: "linear" }
        }
      >
        <span>
          {text}
          {text}
        </span>
        <span>
          {text}
          {text}
        </span>
      </motion.div>
    </div>
  );
}

export function Home() {
  const { text, isVIE } = useLocale();
  const { members, projects, events, bootstrapStatus } = useStore();

  const isDataLoading = bootstrapStatus === "loading" || bootstrapStatus === "slow";

  const recentEvents = events.slice(0, 3);
  const recentProjects = projects.slice(0, 3);
  const recentMembers = members.slice(0, 8);
  const featuredUnits = [
    {
      id: "wallet-adapter",
      title: "Solana Wallet Adapter",
      description: "Learn how to connect Solana wallets in React applications.",
    },
    {
      id: "anchor-programs",
      title: "Intro to Anchor",
      description:
        "Write your first Solana program using the Anchor framework.",
    },
    {
      id: "spl-tokens",
      title: "SPL Token Creation",
      description: "Mint and transfer your own custom tokens on Solana.",
    },
  ];

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="container mx-auto px-4 py-12 md:py-24 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT: Content list */}
          <div className="lg:col-span-6 flex flex-col items-start z-10 order-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-surface font-mono text-[10px] tracking-widest uppercase font-bold text-text-main mb-8 border-2 border-text-main shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {text("System Live", "Hệ thống đang hoạt động")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`font-display font-black text-6xl md:text-7xl lg:text-8xl uppercase mb-8 ${
                isVIE
                  ? "tracking-tight leading-[0.98] md:leading-[0.92] lg:leading-[0.9]"
                  : "tracking-tighter leading-[0.85]"
              }`}
            >
              <span className="block">{isVIE ? "CHÚNG TÔI" : "WE"}</span>
              <span className={`block ${isVIE ? "mt-2.5 md:mt-3.5" : "mt-1.5 md:mt-2"}`}>
                <GlitchText
                  words={isVIE ? ["XÂY", "HỌC", "SHIP", "PHÁT TRIỂN"] : ["BUILD", "LEARN", "SHIP", "GROWING"]}
                  className="text-primary drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] motion-safe:transition-colors"
                />
              </span>
              <span className={`block ${isVIE ? "mt-2.5 md:mt-3.5" : "mt-1.5 md:mt-2"}`}>
                {isVIE ? "CÙNG NHAU." : "TOGETHER."}
              </span>
            </motion.h1>

             <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-text-muted max-w-sm mb-10 leading-relaxed font-mono"
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
              className="flex flex-col sm:flex-row gap-4 w-full"
            >
              <Link to="/academy" className="w-full sm:w-auto">
                <ActionButton variant="primary" className="w-full justify-center">
                  {text("Start Learning", "Bắt đầu học")} &rarr;
                </ActionButton>
              </Link>
              <Link to="/projects" className="w-full sm:w-auto">
                <ActionButton variant="secondary" className="w-full justify-center">
                  {text("Explore Projects", "Khám phá dự án")}
                </ActionButton>
              </Link>
            </motion.div>
          </div>

          {/* RIGHT: Code Interface Panel */}
          <div className="lg:col-span-6 hidden lg:flex flex-col justify-center order-2 relative z-10 w-full max-w-[500px] h-full min-h-[480px] ml-auto">
             <div className="w-full h-full flex flex-col bg-surface border-[3px] border-text-main shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] overflow-hidden transform md:-rotate-2 hover:rotate-0 hover:translate-y-[-4px] hover:translate-x-[-4px] hover:shadow-[12px_12px_0_0_#000] dark:hover:shadow-[12px_12px_0_0_#fff] transition-all duration-300">
              {/* Terminal Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-text-main border-b-[3px] border-text-main">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-main-bg"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-main-bg"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-main-bg"></div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="font-mono text-[11px] uppercase text-main-bg font-black tracking-widest bg-main-bg/20 px-3 py-1 rounded">
                    dsuc_core.rs
                  </span>
                </div>
              </div>

              {/* Terminal Content */}
              <div className="p-4 sm:p-6 flex-1 flex flex-row bg-[#0B0F17] overflow-hidden text-slate-300 relative">
                <div className="absolute top-2 right-4 text-slate-800 font-mono text-[10px] select-none opacity-50">
                   RUST_ENV=prod
                </div>
                <div className="absolute bottom-2 right-4 text-slate-800 font-mono text-[10px] select-none opacity-50">
                   cargo run --release
                </div>
                {/* Decorative line numbers */}
                <div className="select-none flex flex-col items-end pr-4 mr-4 border-r border-slate-800 text-slate-600 font-mono text-[9px] sm:text-[10px] leading-[1.6]">
                  {[...Array(23)].map((_, i) => <div key={i}>{i+1}</div>)}
                </div>
                
                {/* Code Body */}
                <div className="select-none flex flex-col w-full font-mono text-[9px] sm:text-[10px] leading-[1.6]">
                  <div><span className="text-pink-400 font-bold">fn</span> <span className="text-yellow-300 font-bold">main</span>() {"{"}</div>
                  <div className="pl-4"><span className="text-pink-400 font-bold">let</span> key = <span className="text-emerald-400">b"DSUC"</span>;</div>
                  <div>&nbsp;</div>
                  <div className="pl-4"><span className="text-pink-400 font-bold">let</span> encrypted = [</div>
                  <div className="pl-8 text-slate-400 tracking-wide">10, 50, 56, 38, 100, 115, 117, 99, 100, 105, 117, 7, 17, 7, 117, 16,</div>
                  <div className="pl-8 text-slate-400 tracking-wide">17, 3, 16, 17, 16, 22, 20, 14, 100, 6, 27, 10, 18, 22, 7, 16,</div>
                  <div className="pl-8 text-slate-400 tracking-wide">13, 7, 12, 99, 7, 31, 0, 1, 78, 21, 58, 54, 42, 55, 48, 39,</div>
                  <div className="pl-8 text-slate-400 tracking-wide">100, 115, 111, 99, 117, 106, 123, 115, 113, 125, 103, 115, 118, 102,</div>
                  <div className="pl-8 text-slate-400 tracking-wide">95, 1, 43, 50, 39, 39, 100, 115, 117, 99, 126, 115, 15, 2,</div>
                  <div className="pl-8 text-slate-400 tracking-wide">12, 115, 122, 99, 16, 27, 26, 7, 13, 6, 24, 99, 107, 115,</div>
                  <div className="pl-8 text-slate-400 tracking-wide">31, 6, 22, 1, 12,</div>
                  <div className="pl-4">];</div>
                  <div>&nbsp;</div>
                  <div className="pl-4"><span className="text-pink-400 font-bold">let</span> decoded: <span className="text-emerald-300">String</span> = encrypted</div>
                  <div className="pl-8 text-blue-300">.iter()</div>
                  <div className="pl-8 text-blue-300">.enumerate()</div>
                  <div className="pl-8 text-blue-300">.map(|(i, b)| (b ^ key[i % key.len()]) <span className="text-pink-400 font-bold">as</span> <span className="text-emerald-300">char</span>)</div>
                  <div className="pl-8 text-blue-300">.collect();</div>
                  <div>&nbsp;</div>
                  <div className="pl-4"><span className="text-yellow-300 font-bold">println!</span>(<span className="text-emerald-400">"{'{'}{'}'}"</span>, decoded);</div>
                  <div>{"}"}</div>
                  <div>&nbsp;</div>
                  <div>&nbsp;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarqueeStrip />

      {/* System Overview Strip */}
      <section className="bg-main-bg/50 border-t border-b border-border-main">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-main border-x border-border-main">
            {[
              { label: text("Members", "Thành viên"), val: members.length, key: "members" as const },
              { label: text("Projects", "Dự án"), val: projects.length, key: "projects" as const },
              { label: text("Events", "Sự kiện"), val: events.length, key: "events" as const },
              { label: text("Academy Units", "Academy Units"), val: 120, key: "academy" as const, fixed: true },
            ].map((stat, i) => {
              const showSkeleton = isDataLoading && !stat.fixed && (stat.val as number) === 0;

              return (
                <div
                  key={i}
                  className="p-6 md:p-8 text-center flex flex-col items-center justify-center"
                >
                  {showSkeleton ? (
                    <div className="h-10 w-16 md:h-12 md:w-20 bg-surface motion-safe:animate-pulse mb-2" />
                  ) : (
                    <p className="font-display font-bold text-4xl lg:text-5xl mb-2">
                      {stat.fixed ? stat.val : (stat.val || "0")}
                    </p>
                  )}
                  <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
