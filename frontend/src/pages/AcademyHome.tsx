import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Flame,
  Sparkles,
  Trophy,
  CheckCircle,
  Code
} from "lucide-react";

import type {
  AcademyLearnerStats,
  AcademyV2CommunityTrack,
  AcademyV2Path,
} from "@/types";
import { fetchAcademyV2Catalog } from "@/lib/academy/v2Api";
import { useAcademyProgressState } from "@/lib/academy/useAcademyProgress";
import { countCompletedAcademyV2CourseUnits } from "@/lib/academy/v2Progress";
import { useStore } from "@/store/useStore";
import {
  ActionButton,
  SoftBrutalCard,
  StatusBadge,
  SectionHeader,
} from "@/components/ui/Primitives";

const ACADEMY_TIME_ZONE = "Asia/Ho_Chi_Minh";
const academyDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ACADEMY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const academyWeekdayFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: ACADEMY_TIME_ZONE,
  weekday: "short",
});
const academyDayNumberFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: ACADEMY_TIME_ZONE,
  day: "2-digit",
});

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

function academyDayKey(value: Date) {
  const parts = academyDayFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  const day = parts.find((part) => part.type === "day")?.value || "00";
  return `${year}-${month}-${day}`;
}

export function AcademyHome() {
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [paths, setPaths] = useState<AcademyV2Path[]>([]);
  const [communityTracks, setCommunityTracks] = useState<
    AcademyV2CommunityTrack[]
  >([]);
  const [learnerStats, setLearnerStats] = useState<AcademyLearnerStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress],
  );

  const { state } = useAcademyProgressState({
    identity,
    currentUserId: currentUser?.id ?? null,
    authToken,
    walletAddress,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setError("");
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || "";
        const data = await fetchAcademyV2Catalog(
          base,
          authToken || localStorage.getItem("auth_token"),
          walletAddress,
        );

        if (!cancelled) {
          setPaths(
            (data.curated_paths || [])
              .slice()
              .sort((a, b) => a.order - b.order),
          );
          setCommunityTracks(
            (data.community_tracks || [])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order),
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load academy catalog.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [authToken, walletAddress]);

  useEffect(() => {
    if (!currentUser) {
      setLearnerStats(null);
      return;
    }

    let cancelled = false;

    async function loadLearnerStats() {
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || "";
        const token = authToken || localStorage.getItem("auth_token");
        const headers: Record<string, string> = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        } else if (walletAddress) {
          headers["x-wallet-address"] = walletAddress;
        }

        const response = await fetch(`${base}/api/academy/stats`, {
          headers,
          credentials: "include",
        });
        const result = await response.json().catch(() => null);

        if (!cancelled && response.ok && result?.success && result?.data) {
          setLearnerStats(result.data as AcademyLearnerStats);
        }
      } catch {
        if (!cancelled) {
          setLearnerStats(null);
        }
      }
    }

    void loadLearnerStats();
    return () => {
      cancelled = true;
    };
  }, [authToken, currentUser, walletAddress]);

  const totalCuratedUnits = paths.reduce(
    (sum, path) => sum + path.total_unit_count,
    0,
  );
  const totalCompletedUnits = paths.reduce(
    (sum, path) =>
      sum +
      path.courses.reduce(
        (courseSum, course) =>
          courseSum +
          countCompletedAcademyV2CourseUnits(state.completedLessons, course.id),
        0,
      ),
    0,
  );

  const today = new Date();
  const firstName = currentUser?.name?.split(" ")[0] || "Builder";
  const currentStreak = learnerStats?.streak ?? 0;
  const streakHeadline =
    currentStreak >= 30
      ? "Outstanding Streak"
      : currentStreak >= 7
        ? "Great Pace"
        : currentStreak >= 1
          ? "On a Roll"
          : "Start Your Streak";
  const lastActivityLabel = learnerStats?.last_activity
    ? new Date(learnerStats.last_activity).toLocaleDateString("en-US", {
        timeZone: ACADEMY_TIME_ZONE,
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
  const activeDays = new Set(learnerStats?.active_days || []);
  const streakDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const dayKey = academyDayKey(d);
    return {
      date: d,
      completed: activeDays.has(dayKey),
      isToday: i === 13,
    };
  });

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 space-y-32">
      {/* Hero Section */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-start z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1  mb-8 bg-surface uppercase font-mono text-xs tracking-widest text-text-muted">
              {currentUser ? (
                <>
                  <Trophy size={14} className="text-primary" /> {firstName} is
                  learning
                </>
              ) : (
                "Guest Preview"
              )}
            </div>

            <h1 className="font-display font-bold text-6xl md:text-8xl tracking-tighter leading-[0.85] uppercase mb-8">
              DSUC
              <br />
              <span className="text-primary">Academy</span>
            </h1>

            <p className="text-lg md:text-xl text-text-muted max-w-lg mb-10 leading-relaxed font-sans">
              Learn Solana step-by-step, complete real-world exercises, and
              maintain your learning streak.
            </p>

            <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-8">
              <div className="p-4 bg-surface text-center border-2 border-text-main shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all">
                <BookOpen className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="font-display text-2xl font-bold">
                  {paths.length}
                </p>
                <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                  Paths
                </p>
              </div>
              <div className="p-4 bg-surface text-center border-2 border-text-main shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all">
                <Boxes className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="font-display text-2xl font-bold">
                  {totalCuratedUnits}
                </p>
                <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                  Total Units
                </p>
              </div>
              <div className="p-4 bg-surface text-center border-2 border-text-main shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all">
                <Flame className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="font-display text-2xl font-bold">
                  {totalCompletedUnits}
                </p>
                <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                  Completed
                </p>
              </div>
            </div>
          </div>

          {/* Streak Board */}
          <div className="lg:col-span-5 relative w-full h-full min-h-[300px]">
            <div className="w-full bg-surface border-2 border-text-main p-0 shadow-[8px_8px_0_0_#000] flex flex-col h-full group transition-all hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#000]">
              {currentUser ? (
                <div className="flex-1 flex flex-col">
                  {/* Header part */}
                  <div className="flex items-start justify-between p-6 bg-main-bg border-b-2 border-text-main">
                    <div>
                      <StatusBadge
                        status="Active Streak"
                        className="mb-4 bg-transparent border-text-main text-text-main font-black uppercase text-[10px]"
                      />
                      <div className="font-display text-5xl md:text-6xl text-text-main font-black leading-none drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
                        {currentStreak}
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-text-muted font-bold uppercase tracking-widest">
                        {streakHeadline}
                      </div>
                    </div>
                    <div className="w-16 h-16 border-2 border-text-main bg-primary flex items-center justify-center shrink-0 shadow-[4px_4px_0_0_#000]">
                      <Flame className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Calendar part */}
                  <div className="p-6 bg-surface flex-1 flex flex-col justify-center">
                    <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-6">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                        <div key={day} className="text-center font-mono text-[9px] uppercase font-bold text-text-muted mb-1">
                          {day}
                        </div>
                      ))}
                      {streakDays.map((day, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1 group relative"
                        >
                          <div
                            className={`w-full aspect-square flex items-center justify-center border-2 transition-all ${day.completed ? "bg-primary border-text-main text-primary-foreground shadow-[2px_2px_0_0_#000] z-10" : "bg-main-bg border-border-main text-text-muted"} ${day.isToday && !day.completed ? "border-dashed border-primary bg-primary/10 animate-pulse" : ""} ${day.isToday && day.completed ? "animate-pulse" : ""}`}
                          >
                            {day.completed ? (
                              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 stroke-[3]" />
                            ) : day.isToday ? (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            ) : null}
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-surface text-[10px] font-mono font-bold px-2 py-1 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            {academyDayNumberFormatter.format(day.date)} {academyWeekdayFormatter.format(day.date)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <div className="border-2 border-text-main bg-main-bg p-3 shadow-[2px_2px_0_0_#000]">
                        <div className="text-[9px] font-mono uppercase tracking-widest font-black text-text-muted mb-1 flex items-center gap-1">
                          <Flame size={10} className="text-primary"/> Current Streak
                        </div>
                        <div className="font-heading font-black text-xl md:text-2xl">{currentStreak} Days</div>
                      </div>
                      <div className="border-2 border-text-main bg-main-bg p-3 shadow-[2px_2px_0_0_#000]">
                        <div className="text-[9px] font-mono uppercase tracking-widest font-black text-text-muted mb-1 flex items-center gap-1">
                          <Code size={10} /> Last Active
                        </div>
                        <div className="font-heading font-black text-xl md:text-xl truncate leading-relaxed">
                          {lastActivityLabel || "Never"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-center items-center text-center p-8 bg-surface">
                  <div className="w-20 h-20 bg-main-bg border-4 border-text-main shadow-[4px_4px_0_0_#000] flex items-center justify-center mb-6 -rotate-6">
                    <Flame className="w-10 h-10 text-text-muted" strokeWidth={3} />
                  </div>
                  <StatusBadge status="Preview Mode" className="mb-4 bg-main-bg border-2 border-text-main" />
                  <h3 className="font-heading text-2xl font-black uppercase text-text-main mb-4 tracking-tight">
                    Building Habit
                  </h3>
                  <p className="text-sm font-sans text-text-muted mb-8 max-w-sm">
                    Connect your wallet or login to save your streak, track lesson progress, and build your builder reputation.
                  </p>
                  <ActionButton onClick={() => document.dispatchEvent(new CustomEvent('open-login-modal'))} variant="primary" className="shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] -translate-y-1">
                    Connect to Start
                  </ActionButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Curated Paths Section */}
      <section>
        <SectionHeader
          title="Curated Paths"
          subtitle="Structured learning stages designed by DSUC Labs."
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse bg-surface border border-border-main"
              />
            ))}
          </div>
        ) : error ? (
          <div className="-500/50 bg-red-500/10 text-red-500 px-6 py-4 text-sm font-mono text-center">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {paths.map((path) => {
              const completedUnits = path.courses.reduce(
                (sum, course) =>
                  sum +
                  countCompletedAcademyV2CourseUnits(
                    state.completedLessons,
                    course.id,
                  ),
                0,
              );
              const progressPercent =
                path.total_unit_count > 0
                  ? Math.round((completedUnits / path.total_unit_count) * 100)
                  : 0;

              return (
                <Link key={path.id} to={`/academy/path/${path.id}`} className="focus:outline-none">
                  <div className="group h-full flex flex-col bg-surface border-2 border-text-main shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] transition-all p-0">
                    <div className="relative w-full h-1.5 border-b-2 border-text-main bg-main-bg">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="px-6 py-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <StatusBadge status={path.tag || path.difficulty} className="border-2 border-text-main bg-blue-600 text-white" />
                        <div className="text-xl font-display font-black text-text-main group-hover:text-primary transition-colors">
                          {progressPercent}%
                        </div>
                      </div>
                      <h3 className="font-heading text-xl font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {path.title}
                      </h3>
                      <p className="font-mono text-xs text-text-muted mb-6 flex-1 line-clamp-3">
                        {path.description || "Master the concepts with structured learning paths."}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6 w-full mt-auto font-mono text-center">
                        <div className="px-3 py-2 border-2 border-border-main bg-main-bg">
                          <div className="font-black text-xl text-text-main">{path.course_count}</div>
                          <div className="text-[9px] uppercase font-bold text-text-muted mt-1">Courses</div>
                        </div>
                        <div className="px-3 py-2 border-2 border-border-main bg-main-bg">
                          <div className="font-black text-xl text-text-main">{path.total_unit_count}</div>
                          <div className="text-[9px] uppercase font-bold text-text-muted mt-1">Units</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 text-xs font-bold font-mono border-t border-dashed border-border-main mt-auto">
                        <span className="text-text-muted uppercase">
                          {path.difficulty}
                        </span>
                        <span className="inline-flex items-center gap-2 text-primary uppercase text-[10px] tracking-wider transition-all">
                          Open Path <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Community Tracks Section */}
      <section>
        <SectionHeader
          title="Community Tracks"
          subtitle="Additional topics curated by the DSUC community."
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`comm-skel-${index}`}
                className="h-48 animate-pulse bg-surface border border-border-main"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(communityTracks.length > 0 ? communityTracks : [
              { id: "cm-1", title: "Solana Basics Quiz", description: "Test your Solana knowledge with this quick community quiz focusing on accounts and rent.", lesson_count: 5, total_minutes: 15 },
              { id: "cm-2", title: "Rust Ownership Challenges", description: "A few hard questions to test your understanding of Rust borrowing and lifetimes.", lesson_count: 8, total_minutes: 20 },
              { id: "cm-3", title: "DeFi Concepts", description: "Test your knowledge on AMMs, liquidity pools and flash loans.", lesson_count: 3, total_minutes: 10 },
            ]).map((track: any) => (
              <Link key={track.id} to={`/academy/community/${track.id}`} className="focus:outline-none">
                <div className="group h-full flex flex-col bg-surface border-2 border-text-main shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] transition-all p-0">
                  <div className="relative w-full h-1.5 border-b-2 border-text-main bg-text-main" />
                  <div className="px-6 py-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-4 border-b-2 border-border-main mb-4 pb-3">
                      <StatusBadge status="Community" className="bg-main-bg border-2 border-text-main text-text-main" />
                      <Boxes className="w-5 h-5 text-text-main group-hover:text-primary transition-colors" />
                    </div>

                    <h3 className="font-heading text-lg font-black mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>

                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-6 flex-1 font-mono">
                      {track.subtitle ||
                        track.description ||
                        "Community contributed curriculum."}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6 w-full mt-auto font-mono text-center">
                      <div className="px-3 py-2 border-2 border-border-main bg-main-bg">
                        <div className="font-black text-xl text-text-main">{track.lesson_count || 0}</div>
                        <div className="text-[9px] uppercase font-bold text-text-muted mt-1">Lessons</div>
                      </div>
                      <div className="px-3 py-2 border-2 border-border-main bg-main-bg">
                        <div className="font-black text-xl text-text-main">
                          {Math.max(1, Math.round((track.total_minutes || 0) / 60))}
                        </div>
                        <div className="text-[9px] uppercase font-bold text-text-muted mt-1">Hours</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 text-xs font-bold font-mono border-t border-dashed border-border-main mt-auto">
                      <span className="text-text-muted uppercase">
                        Community
                      </span>
                      <span className="inline-flex items-center gap-2 text-primary uppercase text-[10px] tracking-wider transition-all">
                        Start <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
