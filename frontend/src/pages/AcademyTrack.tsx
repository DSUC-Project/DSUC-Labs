import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
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
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
        <div className="text-sky-600 font-bold uppercase tracking-widest text-sm">
          Đang tải cấu trúc lộ trình...
        </div>
      </div>
    );
  }

  if (!trackInfo) {
    return (
      <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest bg-white -200 rounded-3xl m-8">
        {error || "Không tìm thấy lộ trình cộng đồng"}
      </div>
    );
  }

  const lessons = trackInfo.lessons || [];
  const completedCount = lessons.filter((lesson) =>
    isLessonCompleted(state, trackInfo.id, lesson.id),
  ).length;
  const progressPercent =
    lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-10 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 shadow-sm">
        <Link
          to="/academy"
          className="inline-flex items-center gap-2 border-2 border-text-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest font-mono shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all text-text-main"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          BACK
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground border-2 border-text-main shadow-[2px_2px_0_0_#000] text-xs font-bold uppercase tracking-widest">
            <Star size={16} strokeWidth={3} className="fill-text-main" />
            <span className="hidden sm:inline">
              Streak: {currentUser?.streak || 0}
            </span>
            <span className="sm:hidden">{currentUser?.streak || 0}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground border-2 border-text-main shadow-[2px_2px_0_0_#000] text-xs font-bold uppercase tracking-widest">
            <Terminal size={16} strokeWidth={3} />
            <span className="hidden sm:inline">
              Builds: {currentUser?.builds || 0}
            </span>
            <span className="sm:hidden">{currentUser?.builds || 0}</span>
          </div>
        </div>
      </div>

      <header className="text-center space-y-6 pt-4 relative">
        <div className="inline-flex px-4 py-1.5 font-bold tracking-widest uppercase mb-2 bg-surface text-text-main border-2 border-text-main shadow-[4px_4px_0_0_#000] text-sm">
          Chuyên đề: {trackInfo.id}
        </div>
        <h1
          className="text-5xl sm:text-7xl font-display font-bold tracking-tighter text-text-main py-2 uppercase"
          style={{ textShadow: "4px 4px 0 #111827", color: "white" }}
        >
          {trackInfo.title}
        </h1>
      </header>

      <div className="relative mt-16 px-2 sm:px-4">
        <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-2 bg-white border-2 border-text-main shadow-[2px_2px_0_0_#000]">
          <div
            className="w-full bg-primary text-primary-foreground border-b-2 border-text-main transition-all duration-1000"
            style={{ height: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-8 relative z-10">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => {
              const isCompleted = isLessonCompleted(
                state,
                trackInfo.id,
                lesson.id,
              );
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
                  className={`relative flex w-full text-left items-center gap-6 sm:gap-8 group focus-visible:outline-none transition-all ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:-translate-y-1 hover:translate-x-1"}`}
                  onClick={() =>
                    !isLocked &&
                    navigate(`/academy/community/${trackInfo.id}/${lesson.id}`)
                  }
                  disabled={isLocked}
                >
                  <div
                    className={`relative flex-shrink-0 flex items-center justify-center w-12 h-12 border-2 border-text-main transition-colors z-10 ${
                      isLocked
                        ? "bg-gray-200"
                        : isCompleted
                          ? "bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000]"
                          : "bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2
                        size={24}
                        strokeWidth={3}
                        className="text-text-main"
                      />
                    ) : (
                      <div
                        className={`w-3 h-3 ${isLocked ? "bg-gray-400" : "bg-primary text-primary-foreground animate-ping"}`}
                      />
                    )}
                  </div>

                  <div
                    className={`relative flex-grow p-6 sm:p-8 border-2 border-text-main transition-all overflow-hidden ${
                      isCompleted
                        ? "bg-white shadow-[4px_4px_0_0_#000]"
                        : isLocked
                          ? "bg-gray-100 shadow-[4px_4px_0_0_#000]"
                          : "bg-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute inset-0 bg-primary text-primary-foreground opacity-10 z-0"></div>
                    )}
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-2 border-text-main ${
                              isCompleted
                                ? "bg-surface text-text-main shadow-[2px_2px_0_0_#000]"
                                : isCurrent
                                  ? "bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000]"
                                  : "bg-white text-gray-500"
                            }`}
                          >
                            Lesson {index + 1}
                          </span>
                          {isCurrent && (
                            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-surface text-text-main border border-border-main shadow-sm animate-pulse">
                              In Progress
                            </span>
                          )}
                        </div>
                        <h3
                          className={`text-2xl font-display font-bold uppercase tracking-tight ${
                            isCompleted
                              ? "text-text-main"
                              : isLocked
                                ? "text-gray-500"
                                : "text-primary group-hover:text-primary"
                          }`}
                        >
                          {lesson.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs uppercase font-bold tracking-widest shrink-0">
                        <span
                          className={`flex items-center gap-2 ${isCompleted ? "text-primary" : isLocked ? "text-gray-500" : "text-primary"}`}
                        >
                          <Clock size={16} strokeWidth={3} /> {lesson.minutes}{" "}
                          PHÚT
                        </span>
                        {isLocked ? (
                          <div className="p-2 border-2 border-gray-400 bg-gray-200 text-gray-400">
                            <Lock size={18} strokeWidth={3} />
                          </div>
                        ) : (
                          <div
                            className={`px-5 py-2 border-2 border-text-main shadow-[4px_4px_0_0_#000] transition-transform ${isCompleted ? "bg-surface text-text-main group-hover:-translate-y-1" : "bg-primary text-primary-foreground group-hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000]"}`}
                          >
                            {isCompleted ? "Học lại" : "Bắt đầu"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-text-main font-bold uppercase tracking-widest w-full text-center bg-white border-2 border-text-main shadow-[4px_4px_0_0_#000] p-12">
              Không có bài học nào trong chuyên đề này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
