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

import type {
  AcademyLessonAdmin,
  AcademyQuestion,
  AcademyQuestionChoice,
  AcademyTrackAdmin,
  PublishStatus,
} from '@/types';
import { useStore } from '@/store/useStore';
import { normalizeAcademyLesson, normalizeAcademyTrack } from '@/lib/academy/catalog';
import { normalizeAcademyQuestion } from '@/lib/academy/questions';

type TrackFormState = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: PublishStatus;
  sort_order: number;
};

type LessonFormState = {
  track: string;
  lesson_id: string;
  title: string;
  minutes: number;
  content_md: string;
  callouts_text: string;
  status: PublishStatus;
  sort_order: number;
};

type QuestionFormState = {
  track: string;
  lesson_id: string;
  prompt: string;
  choices: AcademyQuestionChoice[];
  correct_choice_id: string;
  explanation: string;
  sort_order: number;
  status: PublishStatus;
};

const STATUS_OPTIONS: PublishStatus[] = ['Draft', 'Published', 'Archived'];

function normalizeTrackId(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

function createEmptyTrackForm(): TrackFormState {
  return {
    id: '',
    title: '',
    subtitle: '',
    description: '',
    status: 'Published',
    sort_order: 0,
  };
}

function createEmptyLessonForm(track = '', lessonId = ''): LessonFormState {
  return {
    track,
    lesson_id: lessonId,
    title: '',
    minutes: 10,
    content_md: '',
    callouts_text: '[]',
    status: 'Published',
    sort_order: 0,
  };
}

function createEmptyQuestionForm(track = '', lessonId = ''): QuestionFormState {
  return {
    track,
    lesson_id: lessonId,
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

function lessonToForm(lesson: AcademyLessonAdmin): LessonFormState {
  return {
    track: lesson.track,
    lesson_id: lesson.lesson_id,
    title: lesson.title,
    minutes: Number(lesson.minutes || 10),
    content_md: lesson.content_md || '',
    callouts_text: JSON.stringify(lesson.callouts || [], null, 2),
    status: lesson.status || 'Published',
    sort_order: Number(lesson.sort_order || 0),
  };
}

function questionToForm(question: AcademyQuestion): QuestionFormState {
  return {
    track: question.track,
    lesson_id: question.lesson_id,
    prompt: question.prompt,
    choices:
      question.choices.length > 0
        ? question.choices
        : createEmptyQuestionForm(question.track, question.lesson_id).choices,
    correct_choice_id: question.correct_choice_id || 'a',
    explanation: question.explanation || '',
    sort_order: Number(question.sort_order || 0),
    status: question.status || 'Published',
  };
}

function parseCalloutsText(value: string) {
  const text = String(value || '').trim();
  if (!text) {
    return [];
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('Callouts must be a JSON array');
  }

  return parsed
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      body: String(item?.body || '').trim(),
    }))
    .filter((item) => item.title || item.body);
}

function validateQuestionForm(form: QuestionFormState) {
  if (!form.track) {
    return 'Track is required.';
  }
  if (!form.lesson_id) {
    return 'Lesson is required.';
  }
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
    return 'Explanation is required.';
  }

  return null;
}

export function AcademyAdmin() {
  const { authToken, walletAddress } = useStore();
  const [tracks, setTracks] = useState<AcademyTrackAdmin[]>([]);
  const [lessons, setLessons] = useState<AcademyLessonAdmin[]>([]);
  const [questions, setQuestions] = useState<AcademyQuestion[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [filterTrack, setFilterTrack] = useState('');
  const [filterLesson, setFilterLesson] = useState('');

  const [trackForm, setTrackForm] = useState<TrackFormState>(() => createEmptyTrackForm());
  const [lessonForm, setLessonForm] = useState<LessonFormState>(() => createEmptyLessonForm());
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(() => createEmptyQuestionForm());

  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const headers = useMemo(
    () => buildAuthHeaders(authToken, walletAddress),
    [authToken, walletAddress]
  );

  const trackOptions = useMemo(
    () => [...tracks].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    [tracks]
  );

  const lessonsForTrack = useMemo(() => {
    if (!filterTrack) {
      return lessons;
    }
    return lessons.filter((lesson) => lesson.track === filterTrack);
  }, [filterTrack, lessons]);

  const questionTrackOptions = useMemo(() => {
    if (!questionForm.track) {
      return [];
    }
    return lessons
      .filter((lesson) => lesson.track === questionForm.track)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  }, [lessons, questionForm.track]);

  const lessonTrackOptions = useMemo(() => {
    if (!lessonForm.track) {
      return [];
    }
    return lessons
      .filter((lesson) => lesson.track === lessonForm.track)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  }, [lessons, lessonForm.track]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((question) => {
        if (filterTrack && question.track !== filterTrack) {
          return false;
        }
        if (filterLesson && question.lesson_id !== filterLesson) {
          return false;
        }
        return true;
      })
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  }, [filterLesson, filterTrack, questions]);

  const lessonCountByTrack = useMemo(() => {
    const map = new Map<string, number>();
    for (const lesson of lessons) {
      map.set(lesson.track, Number(map.get(lesson.track) || 0) + 1);
    }
    return map;
  }, [lessons]);

  async function refreshAll(showSpinner = false) {
    if (showSpinner) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const [trackRes, lessonRes, questionRes] = await Promise.all([
        fetch(`${base}/api/academy/admin/tracks`, { headers, credentials: 'include' }),
        fetch(`${base}/api/academy/admin/lessons`, { headers, credentials: 'include' }),
        fetch(`${base}/api/academy/admin/questions`, { headers, credentials: 'include' }),
      ]);

      const [trackJson, lessonJson, questionJson] = await Promise.all([
        trackRes.json().catch(() => null),
        lessonRes.json().catch(() => null),
        questionRes.json().catch(() => null),
      ]);

      if (!trackRes.ok || !trackJson?.success) {
        throw new Error(trackJson?.message || 'Failed to load academy tracks.');
      }
      if (!lessonRes.ok || !lessonJson?.success) {
        throw new Error(lessonJson?.message || 'Failed to load academy lessons.');
      }
      if (!questionRes.ok || !questionJson?.success) {
        throw new Error(questionJson?.message || 'Failed to load academy questions.');
      }

      const nextTracks = (trackJson.data || []).map(normalizeAcademyTrack);
      const nextLessons = (lessonJson.data || []).map(normalizeAcademyLesson);
      const nextQuestions = (questionJson.data || []).map(normalizeAcademyQuestion);

      setTracks(nextTracks);
      setLessons(nextLessons);
      setQuestions(nextQuestions);
    } catch (err: any) {
      setError(err.message || 'Failed to load academy admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, [headers]);

  useEffect(() => {
    if (trackOptions.length === 0) {
      setFilterTrack('');
      setFilterLesson('');
      return;
    }

    if (!filterTrack || !trackOptions.some((track) => track.id === filterTrack)) {
      setFilterTrack(trackOptions[0].id);
    }
  }, [filterTrack, trackOptions]);

  useEffect(() => {
    if (!filterTrack) {
      setFilterLesson('');
      return;
    }

    const options = lessons
      .filter((lesson) => lesson.track === filterTrack)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

    if (options.length === 0) {
      setFilterLesson('');
      return;
    }

    if (!filterLesson || !options.some((lesson) => lesson.lesson_id === filterLesson)) {
      setFilterLesson(options[0].lesson_id);
    }
  }, [filterLesson, filterTrack, lessons]);

  useEffect(() => {
    if (!trackOptions.length) {
      return;
    }

    if (!lessonForm.track || !trackOptions.some((track) => track.id === lessonForm.track)) {
      setLessonForm((prev) => ({
        ...prev,
        track: trackOptions[0].id,
      }));
    }

    if (!questionForm.track || !trackOptions.some((track) => track.id === questionForm.track)) {
      const defaultTrack = trackOptions[0].id;
      const firstLesson = lessons
        .filter((lesson) => lesson.track === defaultTrack)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))[0];
      setQuestionForm((prev) => ({
        ...prev,
        track: defaultTrack,
        lesson_id: firstLesson?.lesson_id || '',
      }));
    }
  }, [lessonForm.track, lessons, questionForm.track, trackOptions]);

  useEffect(() => {
    if (!lessonForm.track) {
      return;
    }

    if (
      lessonTrackOptions.length > 0 &&
      !lessonTrackOptions.some((item) => item.lesson_id === lessonForm.lesson_id)
    ) {
      setLessonForm((prev) => ({
        ...prev,
        lesson_id: lessonTrackOptions[0].lesson_id,
      }));
    }
  }, [lessonForm.lesson_id, lessonTrackOptions]);

  useEffect(() => {
    if (!questionForm.track) {
      return;
    }

    if (
      questionTrackOptions.length > 0 &&
      !questionTrackOptions.some((item) => item.lesson_id === questionForm.lesson_id)
    ) {
      setQuestionForm((prev) => ({
        ...prev,
        lesson_id: questionTrackOptions[0].lesson_id,
      }));
    }
  }, [questionForm.lesson_id, questionTrackOptions, questionForm.track]);

  function resetTrackForm() {
    setEditingTrackId(null);
    setTrackForm(createEmptyTrackForm());
  }

  function resetLessonForm() {
    setEditingLessonId(null);
    const defaultTrack = trackOptions[0]?.id || '';
    const firstLesson = lessons
      .filter((lesson) => lesson.track === defaultTrack)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))[0];
    setLessonForm(createEmptyLessonForm(defaultTrack, firstLesson?.lesson_id || ''));
  }

  function resetQuestionForm() {
    setEditingQuestionId(null);
    const defaultTrack = trackOptions[0]?.id || '';
    const firstLesson = lessons
      .filter((lesson) => lesson.track === defaultTrack)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))[0];
    setQuestionForm(createEmptyQuestionForm(defaultTrack, firstLesson?.lesson_id || ''));
  }

  async function saveTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const id = normalizeTrackId(trackForm.id);
    if (!editingTrackId && !id) {
      setError('Track ID is required.');
      return;
    }
    if (!trackForm.title.trim()) {
      setError('Track title is required.');
      return;
    }

    setSaving(true);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const endpoint = editingTrackId
        ? `${base}/api/academy/admin/tracks/${editingTrackId}`
        : `${base}/api/academy/admin/tracks`;
      const response = await fetch(endpoint, {
        method: editingTrackId ? 'PATCH' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...trackForm,
          ...(editingTrackId ? {} : { id }),
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save track.');
      }

      setNotice(editingTrackId ? 'Track updated.' : 'Track created.');
      resetTrackForm();
      await refreshAll(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save track.');
    } finally {
      setSaving(false);
    }
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!lessonForm.track) {
      setError('Track is required for lesson.');
      return;
    }
    if (!lessonForm.lesson_id.trim()) {
      setError('Lesson ID is required.');
      return;
    }
    if (!lessonForm.title.trim()) {
      setError('Lesson title is required.');
      return;
    }

    let parsedCallouts: { title: string; body: string }[];
    try {
      parsedCallouts = parseCalloutsText(lessonForm.callouts_text);
    } catch (err: any) {
      setError(err.message || 'Invalid callouts JSON.');
      return;
    }

    setSaving(true);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const endpoint = editingLessonId
        ? `${base}/api/academy/admin/lessons/${editingLessonId}`
        : `${base}/api/academy/admin/lessons`;
      const response = await fetch(endpoint, {
        method: editingLessonId ? 'PATCH' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...lessonForm,
          track: normalizeTrackId(lessonForm.track),
          lesson_id: lessonForm.lesson_id.trim(),
          callouts: parsedCallouts,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save lesson.');
      }

      setNotice(editingLessonId ? 'Lesson updated.' : 'Lesson created.');
      resetLessonForm();
      await refreshAll(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  }

  function updateChoice(index: number, patch: Partial<AcademyQuestionChoice>) {
    setQuestionForm((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, ...patch } : choice
      ),
    }));
  }

  function addChoice() {
    setQuestionForm((prev) => {
      const nextId = String.fromCharCode(97 + prev.choices.length);
      return {
        ...prev,
        choices: [...prev.choices, { id: nextId, label: '' }],
      };
    });
  }

  function removeChoice(index: number) {
    setQuestionForm((prev) => {
      const nextChoices = prev.choices.filter((_, choiceIndex) => choiceIndex !== index);
      const correctStillExists = nextChoices.some((choice) => choice.id === prev.correct_choice_id);

      return {
        ...prev,
        choices: nextChoices,
        correct_choice_id: correctStillExists ? prev.correct_choice_id : nextChoices[0]?.id || 'a',
      };
    });
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const validationError = validateQuestionForm(questionForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const endpoint = editingQuestionId
        ? `${base}/api/academy/admin/questions/${editingQuestionId}`
        : `${base}/api/academy/admin/questions`;
      const response = await fetch(endpoint, {
        method: editingQuestionId ? 'PATCH' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...questionForm,
          track: normalizeTrackId(questionForm.track),
          lesson_id: questionForm.lesson_id.trim(),
          choices: questionForm.choices.filter((choice) => choice.id.trim() && choice.label.trim()),
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save question.');
      }

      setNotice(editingQuestionId ? 'Question updated.' : 'Question created.');
      resetQuestionForm();
      await refreshAll(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrack(track: AcademyTrackAdmin) {
    if (!window.confirm(`Delete track "${track.title}" and all related lessons/questions/progress?`)) {
      return;
    }

    setDeletingKey(`track:${track.id}`);
    setError('');
    setNotice('');
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const response = await fetch(`${base}/api/academy/admin/tracks/${track.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'Failed to delete track.');
      }

      setNotice('Track deleted.');
      if (editingTrackId === track.id) {
        resetTrackForm();
      }
      await refreshAll(true);
    } catch (err: any) {
      setError(err.message || 'Failed to delete track.');
    } finally {
      setDeletingKey(null);
    }
  }

  async function deleteLesson(lesson: AcademyLessonAdmin) {
    if (!window.confirm(`Delete lesson "${lesson.title}" and related questions/progress?`)) {
      return;
    }

    setDeletingKey(`lesson:${lesson.id}`);
    setError('');
    setNotice('');
    try {
      const base = (import.meta as any).env.VITE_API_BASE_URL || '';
      const response = await fetch(`${base}/api/academy/admin/lessons/${lesson.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'Failed to delete lesson.');
      }

      setNotice('Lesson deleted.');
      if (editingLessonId === lesson.id) {
        resetLessonForm();
      }
      await refreshAll(true);
    } catch (err: any) {
      setError(err.message || 'Failed to delete lesson.');
    } finally {
      setDeletingKey(null);
    }
  }

  async function deleteQuestion(question: AcademyQuestion) {
    if (!window.confirm(`Delete this question?\n\n${question.prompt}`)) {
      return;
    }

    setDeletingKey(`question:${question.id}`);
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
      if (editingQuestionId === question.id) {
        resetQuestionForm();
      }
      await refreshAll(true);
    } catch (err: any) {
      setError(err.message || 'Failed to delete question.');
    } finally {
      setDeletingKey(null);
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
              Dynamic Academy Builder
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
              Manage tracks, lessons, and quiz questions directly in database. Hardcoded Genin/Chunin/Jonin content is removed; Academy now renders only from these records.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refreshAll(true)}
          disabled={loading || refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-cyber-blue/50 bg-cyber-blue/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing || loading ? 'animate-spin' : ''} aria-hidden="true" />
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-white">Tracks</h2>
          {loading ? (
            <div className="h-28 animate-pulse border border-white/10 bg-white/[0.03]" />
          ) : trackOptions.length === 0 ? (
            <div className="border border-dashed border-cyber-blue/30 bg-surface/60 p-6 text-sm text-white/60">
              No tracks yet. Create your first track on the right.
            </div>
          ) : (
            <div className="grid gap-3">
              {trackOptions.map((track) => (
                <motion.article
                  key={track.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/10 bg-surface/75 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-cyber-blue/30 bg-cyber-blue/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-cyber-blue">
                          {track.id}
                        </span>
                        <span className="border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-white/60">
                          {track.status}
                        </span>
                        <span className="border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-white/60">
                          Lessons: {lessonCountByTrack.get(track.id) || 0}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                        {track.title}
                      </h3>
                      {track.subtitle && (
                        <p className="text-sm text-white/70">{track.subtitle}</p>
                      )}
                      {track.description && (
                        <p className="text-sm text-white/55">{track.description}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTrackId(track.id);
                          setTrackForm({
                            id: track.id,
                            title: track.title,
                            subtitle: track.subtitle || '',
                            description: track.description || '',
                            status: track.status || 'Published',
                            sort_order: Number(track.sort_order || 0),
                          });
                        }}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyber-blue/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black"
                      >
                        <Edit3 size={14} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTrack(track)}
                        disabled={deletingKey === `track:${track.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-red-400/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-200 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit border border-cyber-blue/25 bg-surface/85 p-5 xl:sticky xl:top-28">
          <form onSubmit={saveTrack} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold uppercase tracking-widest text-white">
                {editingTrackId ? 'Edit Track' : 'New Track'}
              </h3>
              {editingTrackId && (
                <button
                  type="button"
                  onClick={resetTrackForm}
                  className="min-h-10 border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors hover:border-white/30 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Track ID
              <input
                value={trackForm.id}
                disabled={!!editingTrackId}
                onChange={(event) => setTrackForm((prev) => ({ ...prev, id: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="solana-beginner"
              />
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Title
              <input
                value={trackForm.title}
                onChange={(event) => setTrackForm((prev) => ({ ...prev, title: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                placeholder="Solana Beginner"
              />
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Subtitle
              <input
                value={trackForm.subtitle}
                onChange={(event) => setTrackForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                placeholder="Build your first onchain app"
              />
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Description
              <textarea
                value={trackForm.description}
                onChange={(event) => setTrackForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="w-full resize-y border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Status
                <select
                  value={trackForm.status}
                  onChange={(event) => setTrackForm((prev) => ({ ...prev, status: event.target.value as PublishStatus }))}
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Sort Order
                <input
                  value={String(trackForm.sort_order)}
                  onChange={(event) => setTrackForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-cyber-yellow px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingTrackId ? <Save size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              {saving ? 'Saving...' : editingTrackId ? 'Save Track' : 'Create Track'}
            </button>
          </form>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="grid gap-3 border border-white/10 bg-surface/75 p-4 md:grid-cols-2">
            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Track Filter
              <select
                value={filterTrack}
                onChange={(event) => setFilterTrack(event.target.value)}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              >
                {trackOptions.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end pb-1 text-xs font-mono uppercase tracking-widest text-white/45">
              Lessons: {lessonsForTrack.length}
            </div>
          </div>

          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-white">Lessons</h2>
          {loading ? (
            <div className="h-28 animate-pulse border border-white/10 bg-white/[0.03]" />
          ) : lessonsForTrack.length === 0 ? (
            <div className="border border-dashed border-cyber-blue/30 bg-surface/60 p-6 text-sm text-white/60">
              No lessons in selected track.
            </div>
          ) : (
            <div className="grid gap-3">
              {lessonsForTrack
                .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
                .map((lesson) => (
                  <motion.article
                    key={lesson.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-white/10 bg-surface/75 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="border border-cyber-blue/30 bg-cyber-blue/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-cyber-blue">
                            {lesson.track} / {lesson.lesson_id}
                          </span>
                          <span className="border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-white/60">
                            {lesson.status}
                          </span>
                          <span className="border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-white/60">
                            {lesson.minutes} min
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                          {lesson.title}
                        </h3>
                        {lesson.content_md && (
                          <p className="line-clamp-2 text-sm text-white/55">{lesson.content_md}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLessonId(lesson.id);
                            setLessonForm(lessonToForm(lesson));
                          }}
                          className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyber-blue/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black"
                        >
                          <Edit3 size={14} aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteLesson(lesson)}
                          disabled={deletingKey === `lesson:${lesson.id}`}
                          className="inline-flex min-h-10 items-center justify-center gap-2 border border-red-400/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-200 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
            </div>
          )}
        </div>

        <aside className="h-fit border border-cyber-blue/25 bg-surface/85 p-5 xl:sticky xl:top-28">
          <form onSubmit={saveLesson} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold uppercase tracking-widest text-white">
                {editingLessonId ? 'Edit Lesson' : 'New Lesson'}
              </h3>
              {editingLessonId && (
                <button
                  type="button"
                  onClick={resetLessonForm}
                  className="min-h-10 border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors hover:border-white/30 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Track
              <select
                value={lessonForm.track}
                onChange={(event) => setLessonForm((prev) => ({ ...prev, track: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              >
                {trackOptions.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Lesson ID
                <input
                  value={lessonForm.lesson_id}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, lesson_id: event.target.value }))}
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                  placeholder="module-1"
                />
              </label>

              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Minutes
                <input
                  value={String(lessonForm.minutes)}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, minutes: Number(event.target.value || 0) }))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Title
              <input
                value={lessonForm.title}
                onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                placeholder="Module 1: Intro"
              />
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Content Markdown
              <textarea
                value={lessonForm.content_md}
                onChange={(event) => setLessonForm((prev) => ({ ...prev, content_md: event.target.value }))}
                rows={6}
                className="w-full resize-y border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Callouts JSON Array
              <textarea
                value={lessonForm.callouts_text}
                onChange={(event) => setLessonForm((prev) => ({ ...prev, callouts_text: event.target.value }))}
                rows={5}
                className="w-full resize-y border border-cyber-blue/25 bg-black/50 px-3 py-2 font-mono text-xs text-white"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Status
                <select
                  value={lessonForm.status}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, status: event.target.value as PublishStatus }))}
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Sort Order
                <input
                  value={String(lessonForm.sort_order)}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-cyber-yellow px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingLessonId ? <Save size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              {saving ? 'Saving...' : editingLessonId ? 'Save Lesson' : 'Create Lesson'}
            </button>
          </form>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="grid gap-3 border border-white/10 bg-surface/75 p-4 md:grid-cols-2">
            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Track
              <select
                value={filterTrack}
                onChange={(event) => setFilterTrack(event.target.value)}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              >
                {trackOptions.map((track) => (
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
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              >
                {lessonsForTrack
                  .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
                  .map((lesson) => (
                    <option key={lesson.id} value={lesson.lesson_id}>
                      {lesson.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-white">Questions</h2>
          {loading ? (
            <div className="h-28 animate-pulse border border-white/10 bg-white/[0.03]" />
          ) : filteredQuestions.length === 0 ? (
            <div className="border border-dashed border-cyber-blue/30 bg-surface/60 p-8 text-center">
              <Database className="mx-auto mb-3 h-10 w-10 text-cyber-blue/50" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold uppercase tracking-widest text-white">
                No questions in this lesson
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
                Create questions from the form on the right.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredQuestions.map((question) => (
                <motion.article
                  key={question.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/10 bg-surface/75 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-cyber-blue/30 bg-cyber-blue/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-cyber-blue">
                          {question.track} / {question.lesson_id} / {question.sort_order}
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
                          setEditingQuestionId(question.id);
                          setQuestionForm(questionToForm(question));
                        }}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyber-blue/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black"
                      >
                        <Edit3 size={14} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteQuestion(question)}
                        disabled={deletingKey === `question:${question.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-red-400/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-200 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit border border-cyber-blue/25 bg-surface/85 p-5 xl:sticky xl:top-28">
          <form onSubmit={saveQuestion} className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold uppercase tracking-widest text-white">
                {editingQuestionId ? 'Edit Question' : 'New Question'}
              </h3>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="min-h-10 border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors hover:border-white/30 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Track
                <select
                  value={questionForm.track}
                  onChange={(event) => {
                    const nextTrack = event.target.value;
                    const firstLesson = lessons
                      .filter((lesson) => lesson.track === nextTrack)
                      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))[0];
                    setQuestionForm((prev) => ({
                      ...prev,
                      track: nextTrack,
                      lesson_id: firstLesson?.lesson_id || '',
                    }));
                  }}
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
                >
                  {trackOptions.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
                Status
                <select
                  value={questionForm.status}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, status: event.target.value as PublishStatus }))}
                  className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
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
                value={questionForm.lesson_id}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, lesson_id: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              >
                {questionTrackOptions.map((lesson) => (
                  <option key={lesson.id} value={lesson.lesson_id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Prompt
              <textarea
                value={questionForm.prompt}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, prompt: event.target.value }))}
                rows={4}
                className="w-full resize-y border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              />
            </label>

            <fieldset className="space-y-3">
              <legend className="text-xs font-mono uppercase tracking-widest text-white/60">
                Answer Choices
              </legend>
              {questionForm.choices.map((choice, index) => (
                <div key={`${index}-${choice.id}`} className="grid grid-cols-[64px_minmax(0,1fr)_40px] gap-2">
                  <input
                    value={choice.id}
                    onChange={(event) => updateChoice(index, { id: event.target.value.trim() })}
                    className="min-h-10 border border-cyber-blue/25 bg-black/50 px-2 text-center font-mono text-sm uppercase text-white"
                    spellCheck={false}
                  />
                  <input
                    value={choice.label}
                    onChange={(event) => updateChoice(index, { label: event.target.value })}
                    className="min-h-10 border border-cyber-blue/25 bg-black/50 px-3 text-sm text-white"
                    placeholder="Answer text"
                  />
                  <button
                    type="button"
                    onClick={() => removeChoice(index)}
                    disabled={questionForm.choices.length <= 2}
                    className="inline-flex min-h-10 items-center justify-center border border-white/10 text-white/60 transition-colors hover:border-red-400/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addChoice}
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyber-blue/30 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black"
              >
                <Plus size={14} aria-hidden="true" />
                Add Choice
              </button>
            </fieldset>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Correct Choice ID
              <select
                value={questionForm.correct_choice_id}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, correct_choice_id: event.target.value }))}
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              >
                {questionForm.choices
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
                value={questionForm.explanation}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, explanation: event.target.value }))}
                rows={4}
                className="w-full resize-y border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="space-y-2 text-xs font-mono uppercase tracking-widest text-white/60">
              Sort Order
              <input
                value={String(questionForm.sort_order)}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))}
                inputMode="numeric"
                pattern="[0-9]*"
                className="min-h-11 w-full border border-cyber-blue/25 bg-black/50 px-3 py-2 text-sm text-white"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-cyber-yellow px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} aria-hidden="true" />
              {saving ? 'Saving...' : editingQuestionId ? 'Save Question' : 'Create Question'}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
