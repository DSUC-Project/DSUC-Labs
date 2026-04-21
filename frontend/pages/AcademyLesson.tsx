import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy } from 'lucide-react';

import { TRACKS, lessonsByTrack, findLesson, type TrackId } from '@/lib/academy/curriculum';
import { renderMd } from '@/lib/academy/md';
import LessonAnimation from '@/components/academy/LessonAnimation';
import { Card } from '@/components/academy/ui/Card';
import { Badge } from '@/components/academy/ui/Badge';
import { Button } from '@/components/academy/ui/Button';
import { trackStyle } from '@/components/academy/ui/trackStyle';
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
    return <div className="text-center py-20 text-slate-400">Lesson not found</div>;
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
    return <div className="text-center py-20 text-slate-400">Lesson not found</div>;
  }

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
      setErr('Incorrect answer highlighted in red. Fix it and resubmit.');
    }
  }

  async function finishLesson() {
    setErr('');

    if (lessonDone) {
      return;
    }

    if (!allSubmitted) {
      setErr('Submit each question first.');
      return;
    }

    if (!allCorrect) {
      setErr('Some answers are still incorrect. Fix them and resubmit.');
      return;
    }

    try {
      setBusyFinish(true);
      const updatedQuiz = markQuizPassed(state, track, lessonId);
      const updatedLesson = markLessonComplete(updatedQuiz, track, lessonId);
      persistProgress(updatedLesson);
    } finally {
      setBusyFinish(false);
    }
  }

  const style = trackStyle(track);
  const trackTitle = TRACKS.find((item) => item.id === track)?.title || track;

  return (
    <div className="space-y-6 academy-scope">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to={`/academy/track/${track}`} className="flex items-center hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to {trackTitle}
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-medium truncate">{lesson.title}</span>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-xs text-slate-300">
        {currentUser
          ? `Synced account: ${currentUser.name} (${currentUser.id}) via ${authMethod || 'wallet'}`
          : 'Guest mode active: your progress stays on this browser until you sign in.'}
        {walletAddress ? ` Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}.` : ''}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card hoverEffect={false} className="bg-[#1a1d2d]/90">
            {['m1-blockchain-as-a-computer', 'm2-identity-and-authentication', 'm3-consensus-input-not-memory', 'm4-account-file', 'm5-program-library', 'm7-coding-with-claude'].includes(lessonId) ? (
              <div className="mb-8">
                <LessonAnimation lessonId={lessonId} />
              </div>
            ) : null}

            <h1 className="text-3xl font-bold font-display text-white mb-4">{lesson.title}</h1>

            <div className="flex flex-wrap gap-2 mb-8">
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {lesson.minutes} min
              </Badge>
              <Badge className={`border ${style.badge} bg-transparent`}>Level: {trackTitle}</Badge>
              <Badge variant="neutral">{lesson.quiz.length} Questions</Badge>
              {quizPassed ? <Badge variant="neutral">Quiz passed</Badge> : <Badge variant="neutral">Quiz pending</Badge>}
            </div>

            <div className="space-y-2">{renderMd(lesson.content.md)}</div>

            {lesson.content.callouts?.length ? (
              <div className="mt-8 grid grid-cols-1 gap-3">
                {lesson.content.callouts.map((callout) => (
                  <div key={callout.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="font-bold text-white font-display">{callout.title}</div>
                    <div className="mt-1 text-sm text-slate-300">{callout.body}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Knowledge Check
            </h2>

            {lesson.quiz.map((question) => {
              const submitted = !!submittedQ[question.id];
              const correct = answers[question.id] === question.correctChoiceId;

              return (
                <Card key={question.id} hoverEffect={false} className="border-l-4 border-l-slate-700 overflow-hidden bg-[#1a1d2d]/80">
                  <h3 className="font-bold text-lg mb-4 text-white font-display">{question.prompt}</h3>

                  <div className="space-y-2 mb-6">
                    {question.choices.map((choice) => {
                      const selected = answers[question.id] === choice.id;
                      const isChoiceCorrect = choice.id === question.correctChoiceId;

                      let className = 'border-slate-700 hover:bg-slate-700/50 text-slate-300';
                      if (submitted) {
                        if (isChoiceCorrect) {
                          className = 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50 text-emerald-300';
                        } else if (selected && !isChoiceCorrect) {
                          className = 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/50 text-rose-300 opacity-80';
                        } else {
                          className = 'opacity-40 bg-slate-800/50 border-slate-700';
                        }
                      } else if (selected) {
                        className = 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-500/10 text-indigo-200';
                      }

                      return (
                        <button
                          key={choice.id}
                          onClick={() => {
                            setErr('');
                            setAnswers((prevAnswers) => ({ ...prevAnswers, [question.id]: choice.id }));
                            if (submittedQ[question.id]) {
                              setSubmittedQ((prevSubmitted) => ({ ...prevSubmitted, [question.id]: false }));
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border cursor-pointer transition-all flex items-center ${className}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center flex-shrink-0 ${
                              submitted && isChoiceCorrect
                                ? 'border-emerald-500 bg-emerald-500'
                                : selected && !submitted
                                  ? 'border-indigo-500'
                                  : 'border-slate-500'
                            }`}
                          >
                            {submitted && isChoiceCorrect ? <CheckCircle2 className="w-3 h-3 text-white" /> : null}
                          </div>
                          <span className="text-sm font-medium">{choice.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!submitted ? (
                    <Button onClick={() => submitQuestion(question.id)} disabled={!answers[question.id]} size="sm" variant="primary">
                      Submit Answer
                    </Button>
                  ) : (
                    <div
                      className={`p-4 rounded-xl text-sm ${
                        correct
                          ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-200 border border-rose-500/20'
                      }`}
                    >
                      <p className="font-bold mb-1">{correct ? 'Correct!' : 'Incorrect'}</p>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </Card>
              );
            })}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
              <div className="flex gap-2">
                {prev ? (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/academy/learn/${track}/${prev.id}`)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                ) : null}
                {next ? (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/academy/learn/${track}/${next.id}`)}>
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : null}
              </div>

              <Button onClick={finishLesson} disabled={lessonDone || busyFinish || !allSubmitted || !allCorrect} variant="primary" size="sm">
                {lessonDone ? 'Lesson completed' : busyFinish ? 'Finishing...' : 'Finish lesson'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {err ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200 text-sm break-words">
                {err}
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="sticky top-28 border-indigo-500/20 bg-indigo-900/10 backdrop-blur-md" hoverEffect={false}>
            <h3 className="font-bold text-white font-display mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Lesson Checklist
            </h3>

            <ul className="space-y-3 mb-6">
              {[
                { label: 'Read the lesson', done: cl0 },
                { label: 'Submit all quiz questions', done: allSubmitted },
                { label: 'Get all answers correct (to finish)', done: allCorrect || lessonDone },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-3 text-sm text-slate-300">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                      item.done
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-slate-700 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <span className={item.done ? 'text-slate-200' : 'text-slate-400'}>{item.label}</span>
                </li>
              ))}
            </ul>

            <div className="text-xs text-slate-500 mb-6">
              Finish is enabled only after you submit every question and all answers are correct.
            </div>

            <Button fullWidth variant="primary" onClick={finishLesson} disabled={lessonDone || busyFinish || !allSubmitted || !allCorrect}>
              {lessonDone ? 'Lesson completed' : busyFinish ? 'Finishing...' : 'Finish Lesson'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
