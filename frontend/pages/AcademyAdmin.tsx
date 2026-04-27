import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';

import type { AcademyQuestion, AcademyQuestionChoice, PublishStatus } from '@/types';
import { useStore } from '@/store/useStore';
import {
  TRACKS,
  findLesson,
  firstLessonId,
  lessonsByTrack,
  type TrackId,
} from '@/lib/academy/curriculum';
import { normalizeAcademyQuestion } from '@/lib/academy/questions';

type QuestionFormState = {
  track: TrackId;
  lesson_id: string;
  prompt: string;
  choices: AcademyQuestionChoice[];
  correct_choice_id: string;
  explanation: string;
  sort_order: number;
  status: PublishStatus;
};

const STATUS_OPTIONS: PublishStatus[] = ['Draft', 'Published', 'Archived'];

function buildAuthHeaders(token: string | null, walletAddress: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers['x-wallet-address'] = walletAddress;
  }

  return headers;
}

function createEmptyForm(track: TrackId = 'genin'): QuestionFormState {
  return {
    track,
    lesson_id: firstLessonId(track),
    prompt: '',
    choices: [
      { id: 'a', label: '' },
      { id: 'b', label: '' },
      { id: 'c', label: '' },
    ],
    correct_choice_id: 'a',
    explanation: '',
    sort_order: 0,
    status: 'Published',
  };
}

function questionToForm(question: AcademyQuestion): QuestionFormState {
  return {
    track: question.track,
    lesson_id: question.lesson_id,
    prompt: question.prompt,
    choices: question.choices.length > 0 ? question.choices : createEmptyForm(question.track).choices,
    correct_choice_id: question.correct_choice_id || 'a',
    explanation: question.explanation || '',
    sort_order: Number(question.sort_order || 0),
    status: question.status || 'Published',
  };
}

function validateQuestionForm(form: QuestionFormState) {
  if (!form.prompt.trim()) {
    return 'Question prompt is required.';
  }

  const validChoices = form.choices.filter((choice) => choice.id.trim() && choice.label.trim());
  if (validChoices.length < 2) {
    return 'Add at least two answer choices.';
  }

  if (!validChoices.some((choice) => choice.id === form.correct_choice_id)) {
    return 'Correct answer must match one of the choice IDs.';
  }

  if (!form.explanation.trim()) {
    return 'Explanation is required so learners know why the answer is correct.';
  }

  return null;
}

export function AcademyAdmin() {
  const { authToken, walletAddress } = useStore();
  const [questions, setQuestions] = useState<AcademyQuestion[]>([]);
  const [form, setForm] = useState<QuestionFormState>(() => createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTrack, setFilterTrack] = useState<TrackId>('genin');
  const [filterLesson, setFilterLesson] = useState<string>(() => firstLessonId('genin'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const headers = useMemo(
    () => buildAuthHeaders(authToken, walletAddress),
    [authToken, walletAddress]
  );

  const filterLessons = useMemo(() => lessonsByTrack(filterTrack), [filterTrack]);
  const formLessons = useMemo(() => lessonsByTrack(form.track), [form.track]);
  const selectedLesson = useMemo(() => {
    try {
      return findLesson(form.track, form.lesson_id);
    } catch {
      return null;
    }
  }, [form.lesson_id, form.track]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (question.track !== filterTrack) {
        return false;
      }

      return !filterLesson || question.lesson_id === filterLesson;
    });
  }, [filterLesson, filterTrack, questions]);

  async function refreshQuestions() {
    setLoading(true);
    setError('');
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const response = await fetch(`${base}/api/academy/admin/questions`, {
        headers,
        credentials: 'include',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to load academy questions.');
      }

      setQuestions((result.data || []).map(normalizeAcademyQuestion));
    } catch (err: any) {
      setError(err.message || 'Failed to load academy questions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshQuestions();
  }, [headers]);

  function updateFormTrack(track: TrackId) {
    const nextLessonId = firstLessonId(track);
    setForm((prev) => ({
      ...prev,
      track,
      lesson_id: nextLessonId,
    }));
  }

  function updateFilterTrack(track: TrackId) {
    setFilterTrack(track);
    setFilterLesson(firstLessonId(track));
  }

  function updateChoice(index: number, patch: Partial<AcademyQuestionChoice>) {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, ...patch } : choice
      ),
    }));
  }

  function addChoice() {
    setForm((prev) => {
      const nextId = String.fromCharCode(97 + prev.choices.length);
      return {
        ...prev,
        choices: [...prev.choices, { id: nextId, label: '' }],
      };
    });
  }

  function removeChoice(index: number) {
    setForm((prev) => {
      const nextChoices = prev.choices.filter((_, choiceIndex) => choiceIndex !== index);
      const correctStillExists = nextChoices.some((choice) => choice.id === prev.correct_choice_id);

      return {
        ...prev,
        choices: nextChoices,
        correct_choice_id: correctStillExists ? prev.correct_choice_id : nextChoices[0]?.id || 'a',
      };
    });
  }

  function resetForm(track: TrackId = form.track) {
    setEditingId(null);
    setForm(createEmptyForm(track));
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const validationError = validateQuestionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const endpoint = editingId
        ? `${base}/api/academy/admin/questions/${editingId}`
        : `${base}/api/academy/admin/questions`;
      const response = await fetch(endpoint, {
        method: editingId ? 'PATCH' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          choices: form.choices.filter((choice) => choice.id.trim() && choice.label.trim()),
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save question.');
      }

      setNotice(editingId ? 'Question updated.' : 'Question created.');
      resetForm(form.track);
      await refreshQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(question: AcademyQuestion) {
    if (!window.confirm(`Delete this question?\n\n${question.prompt}`)) {
      return;
    }

    setDeletingId(question.id);
    setError('');
    setNotice('');

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const response = await fetch(`${base}/api/academy/admin/questions/${question.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'Failed to delete question.');
      }

      setNotice('Question deleted.');
      await refreshQuestions();
      if (editingId === question.id) {
        resetForm(question.track);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete question.');
    } finally {
      setDeletingId(null);
    }
  }

  async function seedCurrentLesson() {
    if (!selectedLesson || selectedLesson.quiz.length === 0) {
      setError('This lesson has no hardcoded quiz to seed.');
      return;
    }

    setSeeding(true);
    setError('');
    setNotice('');

    try {
      const existingPrompts = new Set(
        questions
          .filter((question) => question.track === form.track && question.lesson_id === form.lesson_id)
          .map((question) => question.prompt.trim().toLowerCase())
      );
      const maxSortOrder = questions
        .filter((question) => question.track === form.track && question.lesson_id === form.lesson_id)
        .reduce((max, question) => Math.max(max, Number(question.sort_order || 0)), 0);
      const candidates = selectedLesson.quiz.filter(
        (question) => !existingPrompts.has(question.prompt.trim().toLowerCase())
      );

      if (candidates.length === 0) {
        setNotice('All hardcoded questions for this lesson already exist in DB.');
        return;
      }

      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      for (const [index, question] of candidates.entries()) {
        const response = await fetch(`${base}/api/academy/admin/questions`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            track: form.track,
            lesson_id: form.lesson_id,
            prompt: question.prompt,
            choices: question.choices,
            correct_choice_id: question.correctChoiceId,
            explanation: question.explanation,
            sort_order: maxSortOrder + index + 1,
            status: 'Published',
          }),
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to seed one of the questions.');
        }
      }

      setNotice(`Seeded ${candidates.length} question(s) into DB.`);
      await refreshQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to seed questions.');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <header className="flex flex-col gap-4 border-b border-cyber-blue/20 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 border border-cyber-blue/30 bg-cyber-blue/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-blue">
            <Database size={14} aria-hidden="true" />
            Academy Admin
          </div>
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-widest text-white md:text-5xl">
              Question Bank
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
              Published DB questions override hardcoded quiz content in live Academy lessons.
              Use Draft for work in progress and Archived to hide without deleting.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refreshQuestions()}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-cyber-blue/50 bg-cyber-blue/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-3 border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5">
          <div className="grid gap-3 border border-white/10 bg-surface/75 p-4 md:grid-cols-2">
            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Track
              <select
                value={filterTrack}
                onChange={(event) => updateFilterTrack(event.target.value as TrackId)}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
              >
                {TRACKS.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Lesson
              <select
                value={filterLesson}
                onChange={(event) => setFilterLesson(event.target.value)}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
              >
                {filterLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse border border-white/10 bg-white/[0.03]" />
              ))
            ) : filteredQuestions.length === 0 ? (
              <div className="border border-dashed border-cyber-blue/30 bg-surface/60 p-8 text-center">
                <Database className="mx-auto mb-3 h-10 w-10 text-cyber-blue/50" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold uppercase tracking-widest text-white">
                  No DB questions for this lesson
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
                  Create a question manually or seed the hardcoded quiz into the database, then edit from here.
                </p>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <motion.article
                  key={question.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/10 bg-surface/75 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-cyber-blue/30 bg-cyber-blue/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-cyber-blue">
                          {question.track} / {question.sort_order}
                        </span>
                        <span className="border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-white/60">
                          {question.status}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
                        {question.prompt}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.choices.map((choice) => (
                          <div
                            key={`${question.id}-${choice.id}`}
                            className={`border px-3 py-2 text-xs ${
                              choice.id === question.correct_choice_id
                                ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'
                                : 'border-white/10 bg-black/30 text-white/70'
                            }`}
                          >
                            <span className="font-mono uppercase text-white/50">{choice.id}.</span> {choice.label}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-white/55">{question.explanation}</p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(question.id);
                          setForm(questionToForm(question));
                        }}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyber-blue/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
                      >
                        <Edit3 size={14} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteQuestion(question)}
                        disabled={deletingId === question.id}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-red-400/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-200 transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </div>
        </section>

        <aside className="h-fit border border-cyber-blue/25 bg-surface/85 p-5 xl:sticky xl:top-28">
          <form onSubmit={saveQuestion} className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-widest text-white">
                  {editingId ? 'Edit Question' : 'New Question'}
                </h2>
                <p className="mt-1 text-xs text-white/50">
                  Published questions are used by learners immediately.
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="min-h-10 border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Track
                <select
                  value={form.track}
                  onChange={(event) => updateFormTrack(event.target.value as TrackId)}
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
                >
                  {TRACKS.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PublishStatus }))}
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Lesson
              <select
                value={form.lesson_id}
                onChange={(event) => setForm((prev) => ({ ...prev, lesson_id: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
              >
                {formLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Prompt
              <textarea
                value={form.prompt}
                onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
                rows={4}
                className="w-full resize-y border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
                placeholder="What does a Solana account store?"
              />
            </label>

            <fieldset className="space-y-3">
              <legend className="text-xs font-mono uppercase tracking-widest text-white/60">
                Answer Choices
              </legend>
              {form.choices.map((choice, index) => (
                <div key={`${index}-${choice.id}`} className="grid grid-cols-[64px_minmax(0,1fr)_40px] gap-2">
                  <label className="sr-only" htmlFor={`choice-id-${index}`}>
                    Choice ID
                  </label>
                  <input
                    id={`choice-id-${index}`}
                    value={choice.id}
                    onChange={(event) => updateChoice(index, { id: event.target.value.trim() })}
                    className="min-h-10 border border-cyber-blue/25 bg-black/50 px-2 text-center font-mono text-sm uppercase text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
                    spellCheck={false}
                  />
                  <label className="sr-only" htmlFor={`choice-label-${index}`}>
                    Choice label
                  </label>
                  <input
                    id={`choice-label-${index}`}
                    value={choice.label}
                    onChange={(event) => updateChoice(index, { label: event.target.value })}
                    className="min-h-10 border border-cyber-blue/25 bg-black/50 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
                    placeholder="Answer text"
                  />
                  <button
                    type="button"
                    onClick={() => removeChoice(index)}
                    disabled={form.choices.length <= 2}
                    aria-label={`Remove choice ${choice.id || index + 1}`}
                    className="inline-flex min-h-10 items-center justify-center border border-white/10 text-white/60 transition-colors hover:border-red-400/50 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addChoice}
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyber-blue/30 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
              >
                <Plus size={14} aria-hidden="true" />
                Add Choice
              </button>
            </fieldset>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Correct Choice ID
              <select
                value={form.correct_choice_id}
                onChange={(event) => setForm((prev) => ({ ...prev, correct_choice_id: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
              >
                {form.choices
                  .filter((choice) => choice.id.trim())
                  .map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {choice.id}
                    </option>
                  ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Explanation
              <textarea
                value={form.explanation}
                onChange={(event) => setForm((prev) => ({ ...prev, explanation: event.target.value }))}
                rows={4}
                className="w-full resize-y border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
                placeholder="Explain why this answer is correct."
              />
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Sort Order
              <input
                value={String(form.sort_order)}
                onChange={(event) => setForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))}
                inputMode="numeric"
                pattern="[0-9]*"
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80"
              />
            </label>

            <div className="grid gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-cyber-yellow px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} aria-hidden="true" />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Question'}
              </button>
              <button
                type="button"
                onClick={() => void seedCurrentLesson()}
                disabled={seeding || !selectedLesson}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-cyber-blue/40 bg-cyber-blue/10 px-4 py-3 font-display text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Database size={16} aria-hidden="true" />
                {seeding ? 'Seeding...' : 'Seed This Lesson'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
