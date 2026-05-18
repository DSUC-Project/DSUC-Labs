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
import { useLocale } from "@/lib/locale";
import {
  localizeAcademyPath,
  localizeCommunityTrackSummary,
} from "@/lib/academy/academyLocale";

const ACADEMY_TIME_ZONE = "Asia/Ho_Chi_Minh";
const academyDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ACADEMY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const academyWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ACADEMY_TIME_ZONE,
  weekday: "short",
});
const academyDayNumberFormatter = new Intl.DateTimeFormat("en-US", {
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
  const { text, isVIE } = useLocale();
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
          setError(
            err.message ||
              text(
                "Failed to load academy catalog.",
                "Không thể tải danh mục Academy.",
              ),
          );
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

  const localizedPaths = useMemo(
    () => paths.map((path) => localizeAcademyPath(path, isVIE)),
    [isVIE, paths],
  );
  const localizedCommunityTracks = useMemo(
    () =>
      communityTracks.map((track) =>
        localizeCommunityTrackSummary(track, isVIE),
      ),
    [communityTracks, isVIE],
  );

  const totalCuratedUnits = localizedPaths.reduce(
    (sum, path) => sum + path.total_unit_count,
    0,
  );
  const totalCompletedUnits = localizedPaths.reduce(
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
  const displayLocale = isVIE ? "vi-VN" : "en-US";
  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(displayLocale, {
        timeZone: ACADEMY_TIME_ZONE,
        weekday: "short",
      }),
    [displayLocale],
  );
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(displayLocale, {
        timeZone: ACADEMY_TIME_ZONE,
        month: "long",
        year: "numeric",
      }),
    [displayLocale],
  );
  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(displayLocale, {
        timeZone: ACADEMY_TIME_ZONE,
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [displayLocale],
  );
  const firstName = currentUser?.name?.split(" ")[0] || "Builder";
  const currentStreak = learnerStats?.streak ?? 0;
  const streakHeadline =
    currentStreak >= 30
      ? text("Outstanding Streak", "Streak ấn tượng")
      : currentStreak >= 7
        ? text("Great Pace", "Nhịp học rất tốt")
        : currentStreak >= 1
          ? text("On a Roll", "Đang vào guồng")
          : text("Start Your Streak", "Bắt đầu streak");
  const lastActivityLabel = learnerStats?.last_activity
    ? new Date(learnerStats.last_activity).toLocaleDateString(displayLocale, {
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
    localizedCommunityTracks.length > 0
      ? localizedCommunityTracks
      : [
          {
            id: "cm-1",
            title: text("Solana Basics Quiz", "Quiz nền tảng Solana"),
            subtitle: text(
              "Warm up your fundamentals",
              "Làm nóng lại các kiến thức nền tảng",
            ),
            description: text(
              "Test your Solana knowledge with short community checkpoints around accounts and rent.",
              "Kiểm tra nhanh kiến thức Solana với các checkpoint ngắn về account và rent.",
            ),
            lesson_count: 5,
            total_minutes: 15,
            sort_order: 1,
          },
          {
            id: "cm-2",
            title: text(
              "Rust Ownership Challenges",
              "Challenge về Rust Ownership",
            ),
            subtitle: text(
              "Practice core Rust thinking",
              "Luyện tư duy Rust cốt lõi",
            ),
            description: text(
              "Challenge your understanding of borrowing, references, and safe mutation.",
              "Luyện lại borrowing, references và safe mutation qua các challenge ngắn.",
            ),
            lesson_count: 8,
            total_minutes: 20,
            sort_order: 2,
          },
          {
            id: "cm-3",
            title: text("DeFi Concepts", "Khái niệm DeFi"),
            subtitle: text(
              "Community theory refresh",
              "Ôn nhanh lý thuyết từ cộng đồng",
            ),
            description: text(
              "Quick quizzes on AMMs, liquidity pools, lending, and common DeFi mechanics.",
              "Các quiz ngắn về AMM, liquidity pool, lending và những cơ chế DeFi phổ biến.",
            ),
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
                    {text(`${firstName} is learning`, `${firstName} đang học`)}
                  </>
                ) : (
                  text("Guest preview", "Xem trước")
                )}
              </AcademyBadge>
              <h1 className="mt-6 font-display text-5xl font-bold uppercase tracking-[-0.08em] text-text-main sm:text-6xl lg:text-7xl">
                DSUC
                <br />
                <span className="text-primary">Academy</span>
              </h1>
              <p className="mt-5 max-w-2xl font-mono text-sm leading-relaxed text-text-muted sm:text-base">
                {text(
                  "Learn Solana step by step, move through guided paths, and keep a streak that reflects real progress instead of passive browsing.",
                  "Học Solana từng bước, đi qua các path có hướng dẫn, và giữ streak phản ánh đúng quá trình học thay vì chỉ lướt qua.",
                )}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={
                    localizedPaths[0]
                      ? `/academy/path/${localizedPaths[0].id}`
                      : "/academy"
                  }
                  className="w-full sm:w-auto"
                >
                  <ActionButton className="w-full justify-center">
                    {text("Enter Curated Paths", "Vào lộ trình chọn lọc")}
                  </ActionButton>
                </Link>
                <Link
                  to={`/academy/community/${fallbackCommunityTracks[0]?.id || "cm-1"}`}
                  className="w-full sm:w-auto"
                >
                  <ActionButton variant="secondary" className="w-full justify-center">
                    {text("Open Community Lane", "Vào lane cộng đồng")}
                  </ActionButton>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <AcademyStat
                label={text("Paths", "Path")}
                value={localizedPaths.length}
                meta={text("Structured DSUC tracks", "Các track có cấu trúc của DSUC")}
              />
              <AcademyStat
                label={text("Units", "Units")}
                value={totalCuratedUnits}
                meta={text("Curated learn + practice", "Học và thực hành có chọn lọc")}
              />
              <AcademyStat
                label={text("Completed", "Hoàn thành")}
                value={totalCompletedUnits}
                meta={text("Recorded against your account", "Được ghi nhận vào tài khoản của bạn")}
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
                  <AcademyBadge tone="muted">
                    {text("Active streak", "Streak hiện tại")}
                  </AcademyBadge>
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
                      {text("Streak history", "Lịch sử streak")}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-text-main/80">
                      {text(
                        "Quick preview of your recent qualified study sessions.",
                        "Xem nhanh các phiên học đủ điều kiện gần đây của bạn.",
                      )}
                    </div>
                  </div>
                  <div className="inline-flex h-10 min-w-10 items-center justify-center border border-border-main bg-surface text-primary shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  <span>{monthFormatter.format(today)}</span>
                  <span className="text-primary">
                    {text("View full calendar", "Xem toàn bộ lịch")}
                  </span>
                </div>
                <div className="mb-2 grid grid-cols-7 gap-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <div key={day} className="text-center">
                      {weekdayFormatter
                        .format(new Date(Date.UTC(2024, 0, index + 1)))
                        .slice(0, 2)}
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
                        title={`${academyDayNumberFormatter.format(day.date)} ${weekdayFormatter.format(day.date)}`}
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
                    {totalActiveDays} {text("recorded days", "ngày đã ghi nhận")}
                  </span>
                  <span className="inline-flex items-center gap-2 border border-border-main bg-surface px-2.5 py-1.5">
                    <History className="h-3.5 w-3.5 text-primary" />
                    {text("Tap to expand", "Bấm để mở rộng")}
                  </span>
                </div>
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <AcademyCompactStat
                  label={text("Current streak", "Streak hiện tại")}
                  value={`${currentStreak} ${text("days", "ngày")}`}
                  meta={text("Daily learning activity", "Hoạt động học hằng ngày")}
                  valueClassName="text-xl"
                />
                <AcademyCompactStat
                  label={text("Last active", "Hoạt động gần nhất")}
                  value={lastActivityLabel || text("Never", "Chưa có")}
                  meta={text("Asia/Ho Chi Minh time", "Giờ Asia/Ho Chi Minh")}
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
                <AcademyBadge tone="muted">
                  {text("Preview mode", "Chế độ xem trước")}
                </AcademyBadge>
                <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
                  {text("Build the habit", "Xây thói quen")}
                </h2>
                <p className="mt-3 font-mono text-sm leading-relaxed text-text-muted">
                  {text(
                    "Log in to save streaks, sync your labs, and keep a readable history of what you actually finished.",
                    "Đăng nhập để lưu streak, đồng bộ lab và giữ lại lịch sử rõ ràng về những gì bạn thật sự hoàn thành.",
                  )}
                </p>
              </div>
              <div className="flex justify-center">
                <ActionButton onClick={() => openLoginModal("login")}>
                  {text("Connect to start", "Kết nối để bắt đầu")}
                </ActionButton>
              </div>
            </div>
          )}
        </AcademyPanel>
      </section>

      <ModalShell
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title={text("Streak Calendar", "Lịch streak")}
        label={text("LEARNING HISTORY", "LỊCH SỬ HỌC TẬP")}
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
                  {text("Monthly calendar", "Lịch theo tháng")}
                </div>
                <h3 className="mt-1 font-display text-lg font-black uppercase tracking-tight text-text-main sm:text-xl">
                  {monthFormatter.format(calendarMonth)}
                </h3>
                <p className="mt-1 max-w-xl text-[11px] leading-5 text-text-main/75 sm:text-xs">
                  {text(
                    "Qualified study days across curated paths and community tracks.",
                    "Các ngày học đủ điều kiện trên curated paths và community tracks.",
                  )}
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
                  {text("Streak", "Streak")}
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
                  {text("Recorded", "Đã ghi nhận")}
                </div>
                <div className="mt-1 font-display text-base font-black uppercase tracking-tight text-text-main sm:text-lg">
                  {totalActiveDays}
                </div>
                <div className="mt-1 font-mono text-[9px] leading-4 text-text-muted">
                  {text("Study days", "Ngày học")}
                </div>
              </div>
              <div className="border border-border-main bg-main-bg/65 px-2.5 py-2">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  {text("This month", "Tháng này")}
                </div>
                <div className="mt-1 font-display text-base font-black uppercase tracking-tight text-text-main sm:text-lg">
                  {currentMonthRecordedDays}
                </div>
                <div className="mt-1 font-mono text-[9px] leading-4 text-text-muted">
                  {text("Qualified sessions", "Phiên đủ điều kiện")}
                </div>
              </div>
              <div className="border border-border-main bg-main-bg/65 px-2.5 py-2">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  {text("Last active", "Hoạt động gần nhất")}
                </div>
                <div className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-text-main sm:text-xs">
                  {lastActivityLabel || text("Never", "Chưa có")}
                </div>
                <div className="mt-1 font-mono text-[9px] leading-4 text-text-muted">
                  {text("Asia/Ho Chi Minh time", "Giờ Asia/Ho Chi Minh")}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4">
            <div className="grid grid-cols-7 gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted sm:gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                <div key={day} className="text-center">
                  {weekdayFormatter
                    .format(new Date(Date.UTC(2024, 0, index + 1)))
                    .slice(0, 2)}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthCells.map((cell) => (
                <div
                  key={cell.key}
                  title={fullDateFormatter.format(cell.date)}
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
                {text("Recorded", "Đã ghi nhận")}
              </div>
              <div className="inline-flex items-center gap-2">
                <span className={`h-3 w-3 border ${streakTheme.dayBorder} ${streakTheme.daySoft}`} />
                {text("Today", "Hôm nay")}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>

      <section className="space-y-6">
        <AcademySectionTitle
          eyebrow={text("Structured Tracks", "Track có cấu trúc")}
          title={text("Curated Paths", "Lộ trình chọn lọc")}
          description={text(
            "Progressive tracks designed by DSUC Labs for a clearer move from fundamentals to real practice.",
            "Các track tiến dần do DSUC Labs thiết kế để đi rõ ràng hơn từ nền tảng đến thực hành thực tế.",
          )}
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
            {localizedPaths.map((path) => {
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
                    accentLabel={text(
                      `${progressPercent}% complete`,
                      `Hoàn thành ${progressPercent}%`,
                    )}
                    description={
                      path.description ||
                      text(
                        "Master the concepts with structured learning paths.",
                        "Nắm chắc kiến thức qua các learning path có cấu trúc.",
                      )
                    }
                    tags={[
                      text(`${path.course_count} courses`, `${path.course_count} course`),
                      text(`${path.practice_unit_count} practice`, `${path.practice_unit_count} phần thực hành`),
                      text(`${path.total_unit_count} units`, `${path.total_unit_count} unit`),
                    ]}
                    footerLabel={text("Path Progress", "Tiến độ path")}
                    footerValue={
                      <div className="space-y-2">
                        <AcademyProgressBar value={progressPercent} />
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                          {text(
                            `${completedUnits}/${path.total_unit_count} units completed`,
                            `Hoàn thành ${completedUnits}/${path.total_unit_count} unit`,
                          )}
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
          eyebrow={text("Community Lane", "Lane cộng đồng")}
          title={text("Community Tracks", "Track cộng đồng")}
          description={text(
            "Shorter topic-based tracks contributed by the DSUC community for drills, refreshers, and fast reviews.",
            "Các track ngắn theo từng chủ đề do cộng đồng DSUC đóng góp, phù hợp để luyện tập, ôn lại và review nhanh.",
          )}
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
                category={text("Community", "Cộng đồng")}
                accentLabel={track.subtitle || text("Fast drills", "Luyện nhanh")}
                description={track.description || track.subtitle}
                tags={[
                  text(
                    `${track.lesson_count || 0} lessons`,
                    `${track.lesson_count || 0} bài`,
                  ),
                  text(
                    `${track.total_minutes || 0} minutes`,
                    `${track.total_minutes || 0} phút`,
                  ),
                ]}
                footerLabel={text("Track Summary", "Tóm tắt track")}
                footerValue={
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                    {text(
                      "Community authored checkpoints and short review drills",
                      "Các checkpoint do cộng đồng biên soạn cùng các phần review ngắn",
                    )}
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
