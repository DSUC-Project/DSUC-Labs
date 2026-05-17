import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  History,
  Trophy,
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
import { openLoginModal } from "@/lib/authUi";
import { ActionButton } from "@/components/ui/Primitives";
import { ShowcaseCard } from "@/components/ui/ShowcaseCard";
import {
  AcademyBadge,
  AcademyCompactStat,
  AcademyPage,
  AcademyPanel,
  AcademyProgressBar,
  AcademySectionTitle,
  AcademyStat,
} from "@/components/academy/AcademyPrimitives";
import { ModalShell } from "@/components/ui/ModalShell";
import { streakTheme } from "@/lib/streakTheme";

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
const academyMonthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ACADEMY_TIME_ZONE,
  month: "long",
  year: "numeric",
});
const academyFullDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ACADEMY_TIME_ZONE,
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function academyDateFromKey(key: string) {
  const [year, month, day] = String(key)
    .split("-")
    .map((value) => Number(value));

  return new Date(Date.UTC(year || 1970, (month || 1) - 1, day || 1, 12));
}

function academyMonthStart(value: Date) {
  const key = academyDayKey(value);
  return academyDateFromKey(`${key.slice(0, 7)}-01`);
}

function shiftAcademyMonth(value: Date, delta: number) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth() + delta,
      1,
      12,
      0,
      0,
    ),
  );
}

function buildAcademyMonthCells(value: Date, activeDays: Set<string>) {
  const start = academyMonthStart(value);
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const todayKey = academyDayKey(new Date());
  const cells: Array<{
    key: string;
    label: string;
    date: Date;
    inMonth: boolean;
    completed: boolean;
    isToday: boolean;
  }> = [];

  const firstWeekday = (start.getUTCDay() + 6) % 7;

  for (let i = 0; i < firstWeekday; i += 1) {
    const date = new Date(Date.UTC(year, month, i - firstWeekday + 1, 12));
    const key = academyDayKey(date);
    cells.push({
      key,
      label: academyDayNumberFormatter.format(date),
      date,
      inMonth: false,
      completed: activeDays.has(key),
      isToday: key === todayKey,
    });
  }

  let day = 1;
  while (true) {
    const date = new Date(Date.UTC(year, month, day, 12));
    if (date.getUTCMonth() !== month) {
      break;
    }

    const key = academyDayKey(date);
    cells.push({
      key,
      label: academyDayNumberFormatter.format(date),
      date,
      inMonth: true,
      completed: activeDays.has(key),
      isToday: key === todayKey,
    });
    day += 1;
  }

  while (cells.length % 7 !== 0) {
    const date = new Date(Date.UTC(year, month, day, 12));
    const key = academyDayKey(date);
    cells.push({
      key,
      label: academyDayNumberFormatter.format(date),
      date,
      inMonth: false,
      completed: activeDays.has(key),
      isToday: key === todayKey,
    });
    day += 1;
  }

  return cells;
}

function academyDayKey(value: Date) {
  const parts = academyDayFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  const day = parts.find((part) => part.type === "day")?.value || "00";
  return `${year}-${month}-${day}`;
}

export function AcademyHome() {
  const { currentUser, walletAddress, authToken } = useStore();
  const [paths, setPaths] = useState<AcademyV2Path[]>([]);
  const [communityTracks, setCommunityTracks] = useState<
    AcademyV2CommunityTrack[]
  >([]);
  const [learnerStats, setLearnerStats] = useState<AcademyLearnerStats | null>(
    null,
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
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
  const firstActiveDate = learnerStats?.active_days?.[0]
    ? academyDateFromKey(learnerStats.active_days[0])
    : academyMonthStart(today);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    academyMonthStart(today),
  );
  const latestCalendarMonth = academyMonthStart(today);
  const fallbackCalendarStartMonth = shiftAcademyMonth(latestCalendarMonth, -11);
  const earliestRecordedCalendarMonth = academyMonthStart(firstActiveDate);
  const earliestCalendarMonth =
    earliestRecordedCalendarMonth.getTime() <
    fallbackCalendarStartMonth.getTime()
      ? earliestRecordedCalendarMonth
      : fallbackCalendarStartMonth;
  const canGoToPreviousMonth =
    calendarMonth.getTime() > earliestCalendarMonth.getTime();
  const canGoToNextMonth =
    calendarMonth.getTime() < latestCalendarMonth.getTime();
  const monthCells = buildAcademyMonthCells(calendarMonth, activeDays);
  const totalActiveDays = learnerStats?.active_days?.length || 0;
  const currentMonthRecordedDays = monthCells.filter(
    (cell) => cell.inMonth && cell.completed,
  ).length;

  useEffect(() => {
    setCalendarMonth(academyMonthStart(new Date()));
  }, [currentUser?.id, learnerStats?.active_days?.[0]]);

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

  const fallbackCommunityTracks =
    communityTracks.length > 0
      ? communityTracks
      : [
          {
            id: "cm-1",
            title: "Solana Basics Quiz",
            subtitle: "Warm up your fundamentals",
            description:
              "Test your Solana knowledge with short community checkpoints around accounts and rent.",
            lesson_count: 5,
            total_minutes: 15,
            sort_order: 1,
          },
          {
            id: "cm-2",
            title: "Rust Ownership Challenges",
            subtitle: "Practice core Rust thinking",
            description:
              "Challenge your understanding of borrowing, references, and safe mutation.",
            lesson_count: 8,
            total_minutes: 20,
            sort_order: 2,
          },
          {
            id: "cm-3",
            title: "DeFi Concepts",
            subtitle: "Community theory refresh",
            description:
              "Quick quizzes on AMMs, liquidity pools, lending, and common DeFi mechanics.",
            lesson_count: 3,
            total_minutes: 10,
            sort_order: 3,
          },
        ];

  return (
    <AcademyPage className="space-y-16 md:space-y-20">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <AcademyPanel tone="primary" className="h-full">
          <div className="flex h-full flex-col justify-between gap-8">
            <div>
              <AcademyBadge tone={currentUser ? "primary" : "muted"}>
                {currentUser ? (
                  <>
                    <Trophy className="h-3.5 w-3.5" />
                    {firstName} is learning
                  </>
                ) : (
                  "Guest preview"
                )}
              </AcademyBadge>
              <h1 className="mt-6 font-display text-5xl font-bold uppercase tracking-[-0.08em] text-text-main sm:text-6xl lg:text-7xl">
                DSUC
                <br />
                <span className="text-primary">Academy</span>
              </h1>
              <p className="mt-5 max-w-2xl font-mono text-sm leading-relaxed text-text-muted sm:text-base">
                Learn Solana step by step, move through guided paths, and keep a
                streak that reflects real progress instead of passive browsing.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={paths[0] ? `/academy/path/${paths[0].id}` : "/academy"}
                  className="w-full sm:w-auto"
                >
                  <ActionButton className="w-full justify-center">
                    Enter Curated Paths
                  </ActionButton>
                </Link>
                <Link
                  to={`/academy/community/${fallbackCommunityTracks[0]?.id || "cm-1"}`}
                  className="w-full sm:w-auto"
                >
                  <ActionButton variant="secondary" className="w-full justify-center">
                    Open Community Lane
                  </ActionButton>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <AcademyStat
                label="Paths"
                value={paths.length}
                meta="Structured DSUC tracks"
              />
              <AcademyStat
                label="Units"
                value={totalCuratedUnits}
                meta="Curated learn + practice"
              />
              <AcademyStat
                label="Completed"
                value={totalCompletedUnits}
                meta="Recorded against your account"
                valueClassName="text-primary"
              />
            </div>
          </div>
        </AcademyPanel>

        <AcademyPanel tone="primary" className="h-full">
          {currentUser ? (
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <AcademyBadge tone="muted">Active streak</AcademyBadge>
                  <div className="mt-4 font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-[3.25rem]">
                    {currentStreak}
                  </div>
                  <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                    {streakHeadline}
                  </p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center border ${streakTheme.flameBorder} ${streakTheme.flameSoft} shadow-sm`}>
                  <Flame className={`h-7 w-7 ${streakTheme.flame}`} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="group block rounded-none border border-border-main bg-main-bg/65 p-3.5 text-left transition-colors hover:border-primary/35 hover:bg-main-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                      Streak history
                    </div>
                    <div className="mt-1 text-sm leading-6 text-text-main/80">
                      Quick preview of your recent qualified study sessions.
                    </div>
                  </div>
                  <div className="inline-flex h-10 min-w-10 items-center justify-center border border-border-main bg-surface text-primary shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  <span>{academyMonthFormatter.format(today)}</span>
                  <span className="text-primary">View full calendar</span>
                </div>
                <div className="mb-2 grid grid-cols-7 gap-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="text-center">
                      {day.slice(0, 2)}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {streakDays.map((day, idx) => (
                    <div key={idx}>
                      <div
                        className={`flex aspect-square items-center justify-center border text-[10px] transition-colors ${
                          day.completed
                            ? `${streakTheme.dayBorder} ${streakTheme.daySolid} ${streakTheme.daySolidForeground}`
                            : day.isToday
                              ? `${streakTheme.dayBorder} ${streakTheme.daySoft} ${streakTheme.dayText}`
                              : "border-border-main bg-main-bg text-text-muted"
                        }`}
                        title={`${academyDayNumberFormatter.format(day.date)} ${academyWeekdayFormatter.format(day.date)}`}
                      >
                        {day.completed ? (
                          <span className="font-mono text-[10px] font-bold">
                            {academyDayNumberFormatter.format(day.date)}
                          </span>
                        ) : day.isToday ? (
                          <div className={`h-1.5 w-1.5 rounded-full ${streakTheme.dot}`} />
                        ) : (
                          <span className="font-mono text-[10px] font-bold">
                            {academyDayNumberFormatter.format(day.date)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  <span className="inline-flex items-center gap-2 border border-border-main bg-surface px-2.5 py-1.5">
                    <span className={`h-2 w-2 ${streakTheme.dot}`} />
                    {totalActiveDays} recorded days
                  </span>
                  <span className="inline-flex items-center gap-2 border border-border-main bg-surface px-2.5 py-1.5">
                    <History className="h-3.5 w-3.5 text-primary" />
                    Tap to expand
                  </span>
                </div>
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <AcademyCompactStat
                  label="Current streak"
                  value={`${currentStreak} days`}
                  meta="Daily learning activity"
                  valueClassName="text-xl"
                />
                <AcademyCompactStat
                  label="Last active"
                  value={lastActivityLabel || "Never"}
                  meta="Asia/Ho Chi Minh time"
                  valueClassName="text-xl"
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center gap-6 text-center">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center border ${streakTheme.flameBorder} ${streakTheme.flameSoft} text-text-muted shadow-sm`}>
                <Flame className={`h-10 w-10 ${streakTheme.flame}`} strokeWidth={2.4} />
              </div>
              <div>
                <AcademyBadge tone="muted">Preview mode</AcademyBadge>
                <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
                  Build the habit
                </h2>
                <p className="mt-3 font-mono text-sm leading-relaxed text-text-muted">
                  Log in to save streaks, sync your labs, and keep a readable
                  history of what you actually finished.
                </p>
              </div>
              <div className="flex justify-center">
                <ActionButton onClick={() => openLoginModal("login")}>
                  Connect to start
                </ActionButton>
              </div>
            </div>
          )}
        </AcademyPanel>
      </section>

      <ModalShell
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Streak Calendar"
        label="LEARNING HISTORY"
        panelClassName="max-w-[640px] border border-border-main shadow-[12px_12px_0_0_rgba(0,0,0,0.16)] dark:shadow-[12px_12px_0_0_rgba(0,0,0,0.45)]"
        bodyClassName="p-0"
        viewportClassName="p-3 sm:p-4"
        overlayClassName="bg-main-bg/82 backdrop-blur-md"
      >
        <div className="bg-surface">
          <div className="border-b border-border-main bg-main-bg/55 p-3 sm:p-3.5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                  Monthly calendar
                </div>
                <h3 className="mt-1 font-display text-lg font-black uppercase tracking-tight text-text-main sm:text-xl">
                  {academyMonthFormatter.format(calendarMonth)}
                </h3>
                <p className="mt-1 max-w-xl text-[11px] leading-5 text-text-main/75 sm:text-xs">
                  Qualified study days across curated paths and community tracks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth((current) =>
                      shiftAcademyMonth(current, -1),
                    )
                  }
                  disabled={!canGoToPreviousMonth}
                  className="inline-flex h-9 w-9 items-center justify-center border border-border-main bg-surface text-text-main transition-colors hover:text-[#e5481d] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth((current) =>
                      shiftAcademyMonth(current, 1),
                    )
                  }
                  disabled={!canGoToNextMonth}
                  className="inline-flex h-9 w-9 items-center justify-center border border-border-main bg-surface text-text-main transition-colors hover:text-[#e5481d] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <div className="border border-border-main bg-main-bg/65 px-2.5 py-2">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  Streak
                </div>
                <div className="mt-1 font-display text-base font-black uppercase tracking-tight text-text-main sm:text-lg">
                  {currentStreak}d
                </div>
                <div className="mt-1 font-mono text-[9px] leading-4 text-text-muted">
                  {streakHeadline}
                </div>
              </div>
              <div className="border border-border-main bg-main-bg/65 px-2.5 py-2">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  Recorded
                </div>
                <div className="mt-1 font-display text-base font-black uppercase tracking-tight text-text-main sm:text-lg">
                  {totalActiveDays}
                </div>
                <div className="mt-1 font-mono text-[9px] leading-4 text-text-muted">
                  Study days
                </div>
              </div>
              <div className="border border-border-main bg-main-bg/65 px-2.5 py-2">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  This month
                </div>
                <div className="mt-1 font-display text-base font-black uppercase tracking-tight text-text-main sm:text-lg">
                  {currentMonthRecordedDays}
                </div>
                <div className="mt-1 font-mono text-[9px] leading-4 text-text-muted">
                  Qualified sessions
                </div>
              </div>
              <div className="border border-border-main bg-main-bg/65 px-2.5 py-2">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  Last active
                </div>
                <div className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-text-main sm:text-xs">
                  {lastActivityLabel || "Never"}
                </div>
                <div className="mt-1 font-mono text-[9px] leading-4 text-text-muted">
                  Asia/Ho Chi Minh time
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4">
            <div className="grid grid-cols-7 gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted sm:gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-center">
                  {day.slice(0, 2)}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthCells.map((cell) => (
                <div
                  key={cell.key}
                  title={academyFullDateFormatter.format(cell.date)}
                  className={`relative flex aspect-square items-center justify-center border font-mono text-[10px] font-bold transition-colors sm:text-[11px] ${
                    cell.completed
                      ? `${streakTheme.dayBorder} ${streakTheme.daySolid} ${streakTheme.daySolidForeground} shadow-sm`
                      : cell.isToday
                        ? `${streakTheme.dayBorder} ${streakTheme.daySoft} ${streakTheme.dayText}`
                        : cell.inMonth
                          ? "border-border-main bg-surface text-text-main"
                          : "border-border-main/50 bg-main-bg text-text-muted/50"
                  }`}
                >
                  {cell.completed ? (
                    <>
                      <span>{cell.label}</span>
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#fff7f0]/80" />
                    </>
                  ) : (
                    <span className={cell.inMonth ? "" : "opacity-60"}>
                      {cell.label}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border-main pt-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              <div className="inline-flex items-center gap-2">
                <span className={`h-3 w-3 border ${streakTheme.dayBorder} ${streakTheme.daySolid}`} />
                Recorded
              </div>
              <div className="inline-flex items-center gap-2">
                <span className={`h-3 w-3 border ${streakTheme.dayBorder} ${streakTheme.daySoft}`} />
                Today
              </div>
            </div>
          </div>
        </div>
      </ModalShell>

      <section className="space-y-6">
        <AcademySectionTitle
          eyebrow="Structured Tracks"
          title="Curated Paths"
          description="Progressive tracks designed by DSUC Labs for a clearer move from fundamentals to real practice."
        />

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <AcademyPanel
                key={index}
                className="h-72 animate-pulse"
                padding="p-0"
              />
            ))}
          </div>
        ) : error ? (
          <AcademyPanel tone="warning">
            <p className="font-mono text-sm text-amber-700 dark:text-amber-300">
              {error}
            </p>
          </AcademyPanel>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                <Link key={path.id} to={`/academy/path/${path.id}`} className="block h-full">
                  <ShowcaseCard
                    icon={<Trophy className="h-5 w-5" aria-hidden="true" />}
                    title={path.title}
                    category={path.tag || path.difficulty}
                    accentLabel={`${progressPercent}% complete`}
                    description={
                      path.description ||
                      "Master the concepts with structured learning paths."
                    }
                    tags={[
                      `${path.course_count} courses`,
                      `${path.practice_unit_count} practice`,
                      `${path.total_unit_count} units`,
                    ]}
                    footerLabel="Path Progress"
                    footerValue={
                      <div className="space-y-2">
                        <AcademyProgressBar value={progressPercent} />
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                          {completedUnits}/{path.total_unit_count} units completed
                        </div>
                      </div>
                    }
                    footerAside={
                      <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
                    }
                    className="h-full"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <AcademySectionTitle
          eyebrow="Community Lane"
          title="Community Tracks"
          description="Shorter topic-based tracks contributed by the DSUC community for drills, refreshers, and fast reviews."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {fallbackCommunityTracks.map((track) => (
            <Link
              key={track.id}
              to={`/academy/community/${track.id}`}
              className="block h-full"
            >
              <ShowcaseCard
                icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
                title={track.title}
                category="Community"
                accentLabel={track.subtitle || "Fast drills"}
                description={track.description || track.subtitle}
                tags={[
                  `${track.lesson_count || 0} lessons`,
                  `${track.total_minutes || 0} minutes`,
                ]}
                footerLabel="Track Summary"
                footerValue={
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                    Community authored checkpoints and short review drills
                  </div>
                }
                footerAside={
                  <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
                }
                className="h-full"
              />
            </Link>
          ))}
        </div>
      </section>
    </AcademyPage>
  );
}
