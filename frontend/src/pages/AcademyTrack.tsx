import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Star,
  Terminal,
} from "lucide-react";

import type { AcademyTrackCatalog } from "@/types";
import { useStore } from "@/store/useStore";
import { loadProgress, isLessonCompleted } from "@/lib/academy/progress";
import { normalizeAcademyCatalogTrack } from "@/lib/academy/catalog";
import {
  AcademyBackLink,
  AcademyBadge,
  AcademyEmptyState,
  AcademyPage,
  AcademyPanel,
  AcademyCompactStat,
  AcademyProgressBar,
  AcademySectionTitle,
} from "@/components/academy/AcademyPrimitives";

function buildAuthHeaders(token: string | null, walletAddress: string | null) {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers["x-wallet-address"] = walletAddress;
  }

  return headers;
}

export function AcademyTrack() {
  const params = useParams<{ track: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [trackInfo, setTrackInfo] = useState<AcademyTrackCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const trackId = String(params.track || "").trim();

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress],
  );
  const [state] = useState(() => loadProgress(identity));

  useEffect(() => {
    if (!trackId) {
      setTrackInfo(null);
      setError("Không tìm thấy lộ trình");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTrack() {
      setLoading(true);
      setError("");
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || "";
        const response = await fetch(`${base}/api/academy/catalog`, {
          headers: buildAuthHeaders(
            authToken || localStorage.getItem("auth_token"),
            walletAddress,
          ),
          credentials: "include",
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message || "Không thể tải chi tiết lộ trình cộng đồng.",
          );
        }

        const tracks = (result.data || []).map(normalizeAcademyCatalogTrack);
        const found = tracks.find((item) => item.id === trackId) || null;

        if (!cancelled) {
          if (!found) {
            setError("Không tìm thấy lộ trình");
            setTrackInfo(null);
          } else {
            setTrackInfo(found);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Không thể tải chi tiết lộ trình cộng đồng.");
          setTrackInfo(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTrack();

    return () => {
      cancelled = true;
    };
  }, [authToken, trackId, walletAddress]);

  if (loading) {
    return (
      <AcademyPage>
        <AcademyPanel className="h-72 animate-pulse" padding="p-0" />
      </AcademyPage>
    );
  }

  if (!trackInfo) {
    return (
      <AcademyPage>
        <AcademyEmptyState
          title="Không tìm thấy lộ trình"
          description={error || "Track cộng đồng này hiện không khả dụng."}
        />
      </AcademyPage>
    );
  }

  const lessons = trackInfo.lessons || [];
  const completedCount = lessons.filter((lesson) =>
    isLessonCompleted(state, trackInfo.id, lesson.id),
  ).length;
  const progressPercent =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <AcademyPage>
      <section className="space-y-6">
        <AcademyBackLink to="/academy" label="Back to Academy" />

        <AcademyPanel tone="primary" padding="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <AcademyBadge tone="muted">Community Track</AcademyBadge>
              <AcademyBadge tone="primary">Topic: {trackInfo.id}</AcademyBadge>
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-5xl lg:text-6xl">
                {trackInfo.title}
              </h1>
              <p className="max-w-3xl font-mono text-sm leading-relaxed text-text-muted">
                Community lessons stay compact, but the progression still follows a
                clear order so reviews, quizzes, and completion feel deliberate.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AcademyCompactStat
                label="Lessons"
                value={lessons.length}
                meta={`${completedCount} completed`}
              />
              <AcademyCompactStat
                label="Progress"
                value={`${progressPercent}%`}
                meta="Track completion"
                valueClassName="text-primary"
              />
              <AcademyCompactStat
                label="Streak"
                value={currentUser?.streak || 0}
                meta="Current streak"
              />
              <AcademyCompactStat
                label="Builds"
                value={currentUser?.builds || 0}
                meta="Member profile stat"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                <span>Track completion</span>
                <span>{progressPercent}%</span>
              </div>
              <AcademyProgressBar value={progressPercent} className="h-2.5" />
            </div>
          </div>
        </AcademyPanel>
      </section>

      <section className="space-y-6">
        <AcademySectionTitle
          eyebrow="Lesson Timeline"
          title="Track Flow"
          description="Each lesson unlocks the next one. Completed lessons stay replayable, while the current lesson remains obvious."
        />

        {lessons.length > 0 ? (
          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const isCompleted = isLessonCompleted(state, trackInfo.id, lesson.id);
              const prevLessonId = index > 0 ? lessons[index - 1].id : null;
              const isPrevCompleted = prevLessonId
                ? isLessonCompleted(state, trackInfo.id, prevLessonId)
                : true;
              const isLocked = !isPrevCompleted;
              const isCurrent = !isLocked && !isCompleted;

              return (
                <button
                  type="button"
                  key={lesson.id}
                  disabled={isLocked}
                  onClick={() =>
                    !isLocked &&
                    navigate(`/academy/community/${trackInfo.id}/${lesson.id}`)
                  }
                  className="block w-full text-left disabled:cursor-not-allowed"
                >
                  <AcademyPanel
                    interactive={!isLocked}
                    tone={isCompleted ? "success" : isCurrent ? "primary" : "default"}
                    className={isLocked ? "opacity-60 grayscale" : "group"}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <AcademyBadge tone={isCurrent ? "primary" : "muted"}>
                            Lesson {index + 1}
                          </AcademyBadge>
                          {isCurrent ? (
                            <AcademyBadge tone="primary">In progress</AcademyBadge>
                          ) : null}
                          {isCompleted ? (
                            <AcademyBadge tone="success">Completed</AcademyBadge>
                          ) : null}
                          {isLocked ? <AcademyBadge tone="muted">Locked</AcademyBadge> : null}
                        </div>

                        <div>
                          <h3
                            className={`font-display text-3xl font-black uppercase tracking-tight ${
                              isLocked
                                ? "text-text-muted"
                                : "text-text-main transition-colors group-hover:text-primary"
                            }`}
                          >
                            {lesson.title}
                          </h3>
                          <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {lesson.minutes} phút
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Terminal className="h-3.5 w-3.5" />
                              Community lesson
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 md:min-w-[190px] md:justify-end">
                        <div
                          className={`flex h-11 w-11 items-center justify-center border shadow-sm ${
                            isLocked
                              ? "border-border-main bg-main-bg text-text-muted"
                              : isCompleted
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                : "border-primary/20 bg-primary/10 text-primary"
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="h-4 w-4" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] ${
                            isLocked ? "text-text-muted" : "text-primary"
                          }`}
                        >
                          {isLocked
                            ? "Locked"
                            : isCompleted
                              ? "Review lesson"
                              : "Start lesson"}
                          {!isLocked ? <ArrowRight className="h-3.5 w-3.5" /> : null}
                        </span>
                      </div>
                    </div>
                  </AcademyPanel>
                </button>
              );
            })}
          </div>
        ) : (
          <AcademyEmptyState
            title="Không có bài học"
            description="Track cộng đồng này chưa có lesson nào."
          />
        )}
      </section>
    </AcademyPage>
  );
}
