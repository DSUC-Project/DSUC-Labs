import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy, Terminal, Info, Code } from 'lucide-react';

import { TRACKS, lessonsByTrack, findLesson, type TrackId } from '@/lib/academy/curriculum';
import { renderMd } from '@/lib/academy/md';
import {
  loadProgress,
  saveProgress,
  mergeProgressStates,
  markLessonComplete,
  markQuizPassed,
  isQuizPassed,
  isLessonCompleted,
  type ProgressState,
} from '@/lib/academy/progress';
import { getChecklist, setChecklist } from '@/lib/academy/checklist';
import { useStore } from '@/store/useStore';

function rowsToProgressState(rows: any[]): ProgressState {
  const completedLessons: Record<string, boolean> = {};
  const quizPassed: Record<string, boolean> = {};
  const checklist: Record<string, boolean[]> = {};

  let xp = 0;
  let updatedAt = new Date().toISOString();

  for (const row of rows) {
    const key = `${row.track}:${row.lesson_id}`;
    completedLessons[key] = !!row.lesson_completed;
    quizPassed[key] = !!row.quiz_passed;

    if (Array.isArray(row.checklist)) {
      checklist[key] = row.checklist.map((item: unknown) => item === true);
    }

    xp += Number(row.xp_awarded || 0);

    if (row.updated_at && String(row.updated_at) > updatedAt) {
      updatedAt = String(row.updated_at);
    }
  }

  return {
    completedLessons,
    quizPassed,
    checklist,
    xp,
    updatedAt,
  };
}

function isTrackId(value: string | undefined): value is TrackId {
  return value === 'genin' || value === 'chunin' || value === 'jonin';
}

export function AcademyLesson() {
  const params = useParams<{ track: string; lesson: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authMethod, authToken } = useStore();

  if (!isTrackId(params.track) || !params.lesson) {
    return <div className="text-center py-20 text-white/40 font-mono tracking-widest uppercase">Lesson not found</div>;
  }

  const track = params.track;
  const lessonId = params.lesson;

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );

  const [state, setState] = useState<ProgressState>(() => loadProgress(identity));
  const [busyFinish, setBusyFinish] = useState(false);
  const [err, setErr] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedQ, setSubmittedQ] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const apiBase = (import.meta as any).env.VITE_API_BASE_URL || '';

  const requestHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    } else if (walletAddress) {
      headers['x-wallet-address'] = walletAddress;
    }

    return headers;
  }, [authToken, walletAddress]);

  const canSyncRemote = !!currentUser && (!!authToken || !!walletAddress);

  const syncMissingRows = useCallback(
    async (baseline: ProgressState, merged: ProgressState) => {
      if (!canSyncRemote) {
        return;
      }

      const keys = new Set<string>([
        ...Object.keys(merged.completedLessons || {}),
        ...Object.keys(merged.quizPassed || {}),
        ...Object.keys(merged.checklist || {}),
      ]);

      for (const key of keys) {
        const [rowTrack, rowLessonId] = key.split(':');
        if (!rowTrack || !rowLessonId) {
          continue;
        }

        const mergedCompleted = !!merged.completedLessons[key];
        const mergedQuizPassed = !!merged.quizPassed[key];
        const mergedChecklist = merged.checklist?.[key] || [];

        const baselineCompleted = !!baseline.completedLessons[key];
        const baselineQuizPassed = !!baseline.quizPassed[key];
        const baselineChecklist = baseline.checklist?.[key] || [];

        const checklistChanged =
          baselineChecklist.length !== mergedChecklist.length ||
          baselineChecklist.some((value, index) => value !== mergedChecklist[index]);

        const rowChanged =
          baselineCompleted !== mergedCompleted ||
          baselineQuizPassed !== mergedQuizPassed ||
          checklistChanged;

        if (!rowChanged) {
          continue;
        }

        try {
          await fetch(`${apiBase}/api/academy/progress`, {
            method: 'POST',
            headers: requestHeaders,
            credentials: 'include',
            body: JSON.stringify({
              track: rowTrack,
              lesson_id: rowLessonId,
              lesson_completed: mergedCompleted,
              quiz_passed: mergedQuizPassed,
              checklist: mergedChecklist,
              xp_awarded: mergedCompleted ? 100 : 0,
            }),
          });
        } catch {
          // Keep local merged state when backfill requests fail.
        }
      }
    },
    [apiBase, canSyncRemote, requestHeaders]
  );

  useEffect(() => {
    setState(loadProgress(identity));
    setAnswers({});
    setSubmittedQ({});
    setErr('');
    setCurrentStep(0); // Reset step on lesson change
  }, [identity, track, lessonId]);

  useEffect(() => {
    if (!canSyncRemote) {
      return;
    }

    let cancelled = false;

    async function fetchRemoteProgress() {
      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          headers: requestHeaders,
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        if (!result?.success || !result?.data?.rows || cancelled) {
          return;
        }

        const remoteState = rowsToProgressState(result.data.rows);
        const localState = loadProgress(identity);
        const mergedState = mergeProgressStates(localState, remoteState);
        setState(mergedState);
        saveProgress(identity, mergedState);
        void syncMissingRows(remoteState, mergedState);
      } catch {
        // Keep local progress as fallback when backend is unavailable.
      }
    }

    void fetchRemoteProgress();

    return () => {
      cancelled = true;
    };
  }, [apiBase, canSyncRemote, identity, requestHeaders, syncMissingRows]);

  const syncCurrentLesson = useCallback(
    async (next: ProgressState) => {
      if (!canSyncRemote) {
        return;
      }

      const progressKey = `${track}:${lessonId}`;
      const checklistForLesson = next.checklist?.[progressKey] || [];

      try {
        await fetch(`${apiBase}/api/academy/progress`, {
          method: 'POST',
          headers: requestHeaders,
          credentials: 'include',
          body: JSON.stringify({
            track,
            lesson_id: lessonId,
            lesson_completed: !!next.completedLessons[progressKey],
            quiz_passed: !!next.quizPassed[progressKey],
            checklist: checklistForLesson,
            xp_awarded: next.completedLessons[progressKey] ? 100 : 0,
          }),
        });
      } catch {
        // Local storage remains source of truth when sync fails.
      }
    },
    [apiBase, canSyncRemote, lessonId, requestHeaders, track]
  );

  const persistProgress = useCallback(
    (next: ProgressState) => {
      setState(next);
      saveProgress(identity, next);
      void syncCurrentLesson(next);
    },
    [identity, syncCurrentLesson]
  );

  const lesson = useMemo(() => {
    try {
      return findLesson(track, lessonId);
    } catch {
      return null;
    }
  }, [track, lessonId]);

  const list = useMemo(() => lessonsByTrack(track), [track]);
  const idx = list.findIndex((item) => item.id === lessonId);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  if (!lesson) {
    return <div className="text-center py-20 text-white/40 font-mono tracking-widest uppercase">Lesson not found</div>;
  }

  const totalSteps = 1 + (lesson.quiz ? lesson.quiz.length : 0);
  const progressPercentage = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;

  const quizPassed = isQuizPassed(state, track, lessonId);
  const lessonDone = isLessonCompleted(state, track, lessonId);

  const checklist = getChecklist(state, track, lessonId);
  const cl0 = checklist[0] ?? true;

  function isCorrect(questionId: string): boolean {
    const question = lesson.quiz.find((item) => item.id === questionId);
    if (!question) {
      return false;
    }

    return answers[questionId] === question.correctChoiceId;
  }

  const allSubmitted = lesson.quiz.every((item) => submittedQ[item.id]);
  const allCorrect = lesson.quiz.every((item) => isCorrect(item.id));

  useEffect(() => {
    const nextChecklist = [cl0, allSubmitted, allCorrect || lessonDone];
    const previousChecklist = getChecklist(state, track, lessonId);
    const same =
      previousChecklist.length === nextChecklist.length &&
      previousChecklist.every((value, index) => value === nextChecklist[index]);

    if (!same) {
      const updated = setChecklist(state, track, lessonId, nextChecklist);
      persistProgress(updated);
    }
  }, [allSubmitted, allCorrect, cl0, lessonDone, lessonId, persistProgress, state, track]);

  function submitQuestion(questionId: string) {
    setErr('');
    setSubmittedQ((prevSubmitted) => ({ ...prevSubmitted, [questionId]: true }));
    if (!isCorrect(questionId)) {
      setErr('SYS_ERROR: INCORRECT_DATA. RECALIBRATE AND RETRY.');
    }
  }

  async function finishLesson() {
    setErr('');

    if (lessonDone) {
      if (next) navigate(`/academy/learn/${track}/${next.id}`);
      return;
    }

    if (lesson.quiz.length > 0) {
      if (!allSubmitted) {
        setErr('ERROR: PENDING_SUBMISSIONS_DETECTED.');
        return;
      }
      if (!allCorrect) {
        setErr('ERROR: INVALID_PARAMETERS. FIX BEFORE CONTINUING.');
        return;
      }
    }

    try {
      setBusyFinish(true);
      const updatedQuiz = markQuizPassed(state, track, lessonId);
      const updatedLesson = markLessonComplete(updatedQuiz, track, lessonId);
      persistProgress(updatedLesson);
      if (next) navigate(`/academy/learn/${track}/${next.id}`);
    } finally {
      setBusyFinish(false);
    }
  }

  const trackTitle = TRACKS.find((item) => item.id === track)?.title || track;
  const currentQuizData = currentStep > 0 ? lesson.quiz[currentStep - 1] : null;

  return (
    <div className="space-y-8 pb-32 max-w-4xl mx-auto px-4 mt-8">
      {/* Progress Bar & Header */}
      <div className="flex flex-col gap-4 sticky top-4 z-50 bg-black/80 backdrop-blur-md p-4 border border-cyber-blue/30 rounded-lg cyber-clip-bottom shadow-[0_0_20px_rgba(41,121,255,0.1)]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/academy/track/${track}`)}
            className="flex items-center justify-center w-10 h-10 border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Progress Bar */}
          <div className="flex-1 mx-6 h-2 bg-black border border-cyber-blue/20 overflow-hidden relative">
            <div
              className="absolute top-0 left-0 h-full bg-cyber-blue transition-all duration-500 ease-out shadow-[0_0_10px_rgba(41,121,255,1)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="text-cyber-blue font-mono font-bold tracking-widest text-xs flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cyber-yellow" />
            <span className="hidden sm:inline">STREAK: </span>{currentUser?.streak || 0}
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-white/50 uppercase tracking-widest px-2">
          <span>{trackTitle}</span>
          <span>PHASE {currentStep + 1}/{totalSteps}</span>
        </div>
      </div>

      <div className="bg-[#050B14]/90 backdrop-blur-xl border border-white/20 p-6 sm:p-10 shadow-[0_0_30px_rgba(41,121,255,0.05)] relative min-h-[60vh] flex flex-col">
        {err && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 px-5 py-4 text-red-500 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-3 animate-pulse">
            <Terminal size={14} className="shrink-0" /> {err}
          </div>
        )}

        {/* Step 0: Theory */}
        {currentStep === 0 && (
          <div className="flex-grow animate-in slide-in-from-right-8 duration-500 fade-in">
            <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mb-6 tracking-widest leading-tight uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {lesson.title}
            </h1>

            <div className="prose prose-invert prose-p:text-white/80 prose-headings:font-display prose-headings:font-bold prose-headings:tracking-wider prose-headings:uppercase prose-a:text-cyber-blue prose-a:no-underline hover:prose-a:underline max-w-none text-base sm:text-lg leading-relaxed font-sans mb-8">
              {renderMd(lesson.content.md)}
            </div>

            {lesson.content.callouts?.length ? (
              <div className="mt-8 mb-8 grid grid-cols-1 gap-4">
                {lesson.content.callouts.map((callout) => (
                  <div key={callout.title} className="bg-cyber-blue/5 border-l-4 border-cyber-blue p-5 relative overflow-hidden">
                    <div className="font-display font-bold text-cyber-blue uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
                       <Terminal size={14} /> {callout.title}
                    </div>
                    <div className="text-sm sm:text-base text-white/70 leading-relaxed font-mono relative z-10">{callout.body}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Step N: Quiz Questions */}
        {currentStep > 0 && currentQuizData && (() => {
          const submitted = !!submittedQ[currentQuizData.id];
          const correct = answers[currentQuizData.id] === currentQuizData.correctChoiceId;

          return (
            <div className="flex-grow animate-in slide-in-from-right-8 duration-500 fade-in flex flex-col justify-center">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3 border-b border-cyber-blue/20 pb-4 mb-8">
                <Code className="w-5 h-5 text-cyber-blue" /> EXAM_QUERY [{currentStep}/{lesson.quiz.length}]
              </h2>

              <h3 className="font-mono font-bold text-lg mb-8 text-white leading-relaxed">
                {currentQuizData.prompt}
              </h3>

              <div className="space-y-4 mb-8 font-mono text-sm">
                {currentQuizData.choices.map((choice) => {
                  const selected = answers[currentQuizData.id] === choice.id;
                  const isChoiceCorrect = choice.id === currentQuizData.correctChoiceId;

                  let className = 'border-white/10 hover:border-cyber-blue/50 text-white/70 bg-black/40';
                  if (submitted) {
                    if (isChoiceCorrect) {
                      className = 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue shadow-[0_0_15px_rgba(41,121,255,0.2)]';
                    } else if (selected && !isChoiceCorrect) {
                      className = 'bg-cyber-yellow/10 border-cyber-yellow text-cyber-yellow shadow-[0_0_15px_rgba(255,214,0,0.2)]';
                    } else {
                      className = 'opacity-40 bg-black/60 border-white/5';
                    }
                  } else if (selected) {
                    className = 'border-cyber-blue bg-cyber-blue/10 text-white shadow-[0_0_10px_rgba(41,121,255,0.2)]';
                  }

                  return (
                    <button
                      key={choice.id}
                      onClick={() => {
                        setErr('');
                        setAnswers((prevAnswers) => ({ ...prevAnswers, [currentQuizData.id]: choice.id }));
                        if (submittedQ[currentQuizData.id]) {
                          setSubmittedQ((prevSubmitted) => ({ ...prevSubmitted, [currentQuizData.id]: false }));
                        }
                      }}
                      className={`w-full text-left p-5 border cursor-pointer transition-all flex items-start sm:items-center text-base ${className}`}
                    >
                      <div
                        className={`w-5 h-5 mt-0.5 sm:mt-0 font-bold border mr-4 flex items-center justify-center flex-shrink-0 transition-colors ${
                          submitted && isChoiceCorrect
                            ? 'border-cyber-blue bg-cyber-blue'
                            : selected && !submitted
                              ? 'border-cyber-blue bg-cyber-blue'
                              : 'border-white/20'
                        }`}
                      >
                      </div>
                      <span className="leading-relaxed">{choice.label}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  className={`p-6 text-sm font-mono border animate-in zoom-in-95 duration-300 ${
                    correct
                      ? 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue shadow-[inset_0_0_20px_rgba(41,121,255,0.1)]'
                      : 'bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow shadow-[inset_0_0_20px_rgba(255,214,0,0.1)]'
                  }`}
                >
                  <p className="font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-lg">
                    <Terminal size={20} />
                    {correct ? 'VALID_RESPONSE' : 'INVALID_RESPONSE'}
                  </p>
                  <p className="opacity-90 leading-relaxed text-sm text-white/80">{currentQuizData.explanation}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Action Bottom Bar */}
        <div className="mt-auto pt-8 border-t border-cyber-blue/20 flex justify-end">
          {currentStep === 0 ? (
            <button
              onClick={() => {
                if (lesson.quiz.length > 0) {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  finishLesson();
                }
              }}
              className="w-full sm:w-auto px-8 py-4 bg-cyber-blue text-black font-display font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-[0_0_15px_rgba(41,121,255,0.4)] flex justify-center items-center gap-2"
            >
              {lesson.quiz.length > 0 ? 'START EXAM MODULE' : 'FINALIZE MODULE'} <ArrowRight className="w-5 h-5" />
            </button>
          ) : currentQuizData && (
            (() => {
              const submitted = !!submittedQ[currentQuizData.id];
              const correct = answers[currentQuizData.id] === currentQuizData.correctChoiceId;
              const hasSelected = !!answers[currentQuizData.id];

              if (!submitted || !correct) {
                return (
                  <button
                    onClick={() => submitQuestion(currentQuizData.id)}
                    disabled={!hasSelected}
                    className="w-full sm:w-auto px-8 py-4 bg-black border border-cyber-blue text-cyber-blue font-display font-bold uppercase tracking-widest text-sm hover:bg-cyber-blue hover:text-black transition-all shadow-[0_0_10px_rgba(41,121,255,0.2)] disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-cyber-blue disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    EXECUTE QUERY
                  </button>
                );
              } else {
                // Submitted array correct
                if (currentStep < totalSteps - 1) {
                  return (
                    <button
                      onClick={() => {
                        setCurrentStep(prev => prev + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-8 py-4 bg-cyber-blue text-black font-display font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-[0_0_15px_rgba(41,121,255,0.4)] flex justify-center items-center gap-2"
                    >
                      NEXT QUERY <ArrowRight className="w-5 h-5" />
                    </button>
                  );
                } else {
                  return (
                    <button
                      onClick={finishLesson}
                      disabled={busyFinish}
                      className="w-full sm:w-auto px-8 py-4 bg-cyber-blue text-black font-display font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-[0_0_15px_rgba(41,121,255,0.4)] disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {busyFinish ? 'SAVING...' : 'FINALIZE MODULE'} <CheckCircle2 className="w-5 h-5" />
                    </button>
                  );
                }
              }
            })()
          )}
        </div>
      </div>
    </div>
  );
}
