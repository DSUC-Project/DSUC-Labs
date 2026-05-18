import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Boxes,
  Database,
  History,
  Layers3,
  Plus,
  RefreshCw,
  Route,
  Save,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";

import { ActionButton } from "@/components/ui/Primitives";
import {
  AdminEmptyState,
  AdminField,
  AdminHero,
  AdminListButton,
  AdminMetricCard,
  AdminNotice,
  AdminPageSection,
  AdminPanel,
  AdminTabs,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/AdminConsole";
import { useStore } from "@/store/useStore";
import {
  AcademyActivity,
  AcademyLessonAdmin,
  AcademyOverview,
  AcademyQuestion,
  AcademyQuestionChoice,
  AcademyTrackAdmin,
  AcademyV2Analytics,
  AcademyV2CourseDetail,
  AcademyV2Path,
  AcademyV2UnitDetail,
  AcademyV2UnitSummary,
  PublishStatus,
} from "@/types";
import {
  normalizeAcademyLesson,
  normalizeAcademyTrack,
} from "@/lib/academy/catalog";
import { normalizeAcademyQuestion } from "@/lib/academy/questions";

type AcademyTab =
  | "curated"
  | "tracks"
  | "lessons"
  | "questions"
  | "learners"
  | "progress"
  | "activity";

type TrackFormState = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: PublishStatus;
  sort_order: string;
};

type LessonFormState = {
  track: string;
  lesson_id: string;
  title: string;
  minutes: string;
  content_md: string;
  callouts_text: string;
  status: PublishStatus;
  sort_order: string;
};

type QuestionFormState = {
  track: string;
  lesson_id: string;
  prompt: string;
  choices: AcademyQuestionChoice[];
  correct_choice_id: string;
  explanation: string;
  sort_order: string;
  status: PublishStatus;
};

type AcademyProgressRow = {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  member_type: "member" | "community";
  track: string;
  lesson_id: string;
  lesson_completed: boolean;
  quiz_passed: boolean;
  checklist: boolean[];
  xp_awarded: number;
  updated_at?: string;
};

type CuratedBrowserUnit = AcademyV2UnitSummary & {
  moduleId: string;
  moduleTitle: string;
};

const STATUS_OPTIONS: PublishStatus[] = ["Draft", "Published", "Archived"];

function buildAuthHeaders(token: string | null, walletAddress: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers["x-wallet-address"] = walletAddress;
  }

  return headers;
}

function getApiBase() {
  return (import.meta as any).env.VITE_API_BASE_URL || "";
}

function normalizeTrackId(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createEmptyTrackForm(): TrackFormState {
  return {
    id: "",
    title: "",
    subtitle: "",
    description: "",
    status: "Published",
    sort_order: "0",
  };
}

function trackToForm(track: AcademyTrackAdmin): TrackFormState {
  return {
    id: track.id,
    title: track.title,
    subtitle: track.subtitle,
    description: track.description,
    status: track.status || "Published",
    sort_order: String(track.sort_order || 0),
  };
}

function createEmptyLessonForm(track = ""): LessonFormState {
  return {
    track,
    lesson_id: "",
    title: "",
    minutes: "10",
    content_md: "",
    callouts_text: "[]",
    status: "Published",
    sort_order: "0",
  };
}

function lessonToForm(lesson: AcademyLessonAdmin): LessonFormState {
  return {
    track: lesson.track,
    lesson_id: lesson.lesson_id,
    title: lesson.title,
    minutes: String(lesson.minutes || 10),
    content_md: lesson.content_md || "",
    callouts_text: JSON.stringify(lesson.callouts || [], null, 2),
    status: lesson.status || "Published",
    sort_order: String(lesson.sort_order || 0),
  };
}

function createEmptyQuestionForm(track = "", lessonId = ""): QuestionFormState {
  return {
    track,
    lesson_id: lessonId,
    prompt: "",
    choices: [
      { id: "a", label: "" },
      { id: "b", label: "" },
      { id: "c", label: "" },
    ],
    correct_choice_id: "a",
    explanation: "",
    sort_order: "0",
    status: "Published",
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
    correct_choice_id: question.correct_choice_id || "a",
    explanation: question.explanation || "",
    sort_order: String(question.sort_order || 0),
    status: question.status || "Published",
  };
}

function parseCalloutsText(value: string) {
  const text = String(value || "").trim();
  if (!text) {
    return [];
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("Callouts must be a JSON array.");
  }

  return parsed
    .map((item: any) => ({
      title: String(item?.title || "").trim(),
      body: String(item?.body || "").trim(),
    }))
    .filter((item) => item.title || item.body);
}

function extractPreviewText(value: string, maxLength = 220) {
  const normalized = String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[#>*_\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength).trim()}...`
    : normalized;
}

function flattenCuratedUnits(course: AcademyV2CourseDetail | null) {
  if (!course) {
    return [] as CuratedBrowserUnit[];
  }

  return course.modules.flatMap((module) =>
    [...module.learn_units, ...module.practice_units]
      .slice()
      .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
      .map((unit) => ({
        ...unit,
        moduleId: module.id,
        moduleTitle: module.title,
      })),
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "No activity";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AcademyAdmin() {
  const { authToken, walletAddress } = useStore();
  const headers = useMemo(
    () => buildAuthHeaders(authToken, walletAddress),
    [authToken, walletAddress],
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeTab, setActiveTab] = useState<AcademyTab>("curated");

  const [tracks, setTracks] = useState<AcademyTrackAdmin[]>([]);
  const [lessons, setLessons] = useState<AcademyLessonAdmin[]>([]);
  const [questions, setQuestions] = useState<AcademyQuestion[]>([]);
  const [learnerOverview, setLearnerOverview] = useState<AcademyOverview[]>([]);
  const [progressRows, setProgressRows] = useState<AcademyProgressRow[]>([]);
  const [activityRows, setActivityRows] = useState<AcademyActivity[]>([]);
  const [curatedPaths, setCuratedPaths] = useState<AcademyV2Path[]>([]);
  const [communityTrackSummaries, setCommunityTrackSummaries] = useState<any[]>(
    [],
  );
  const [curatedAnalytics, setCuratedAnalytics] =
    useState<AcademyV2Analytics | null>(null);

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState<TrackFormState>(createEmptyTrackForm());
  const [creatingTrack, setCreatingTrack] = useState(false);
  const [trackSaving, setTrackSaving] = useState(false);
  const [trackDeleting, setTrackDeleting] = useState(false);

  const [lessonTrackFilter, setLessonTrackFilter] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(
    createEmptyLessonForm(),
  );
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonDeleting, setLessonDeleting] = useState(false);

  const [questionTrackFilter, setQuestionTrackFilter] = useState("");
  const [questionLessonFilter, setQuestionLessonFilter] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(
    createEmptyQuestionForm(),
  );
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [questionDeleting, setQuestionDeleting] = useState(false);

  const [learnerQuery, setLearnerQuery] = useState("");
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);

  const [progressQuery, setProgressQuery] = useState("");
  const [selectedProgressId, setSelectedProgressId] = useState<string | null>(null);
  const [progressDeleting, setProgressDeleting] = useState(false);

  const [activityQuery, setActivityQuery] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );
  const [activityDeleting, setActivityDeleting] = useState(false);

  const [selectedCuratedCourseId, setSelectedCuratedCourseId] = useState("");
  const [selectedCuratedUnitId, setSelectedCuratedUnitId] = useState("");
  const [curatedCourseDetail, setCuratedCourseDetail] =
    useState<AcademyV2CourseDetail | null>(null);
  const [curatedUnitDetail, setCuratedUnitDetail] =
    useState<AcademyV2UnitDetail | null>(null);
  const [curatedCourseLoading, setCuratedCourseLoading] = useState(false);
  const [curatedUnitLoading, setCuratedUnitLoading] = useState(false);

  const trackOptions = useMemo(
    () =>
      [...tracks].sort(
        (left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0),
      ),
    [tracks],
  );

  const filteredLessons = useMemo(() => {
    return [...lessons]
      .filter((lesson) =>
        lessonTrackFilter ? lesson.track === lessonTrackFilter : true,
      )
      .sort((left, right) => {
        if (left.track !== right.track) {
          return left.track.localeCompare(right.track);
        }
        return Number(left.sort_order || 0) - Number(right.sort_order || 0);
      });
  }, [lessonTrackFilter, lessons]);

  const filteredQuestions = useMemo(() => {
    return [...questions]
      .filter((question) =>
        questionTrackFilter ? question.track === questionTrackFilter : true,
      )
      .filter((question) =>
        questionLessonFilter ? question.lesson_id === questionLessonFilter : true,
      )
      .sort((left, right) => {
        if (left.track !== right.track) {
          return left.track.localeCompare(right.track);
        }
        if (left.lesson_id !== right.lesson_id) {
          return left.lesson_id.localeCompare(right.lesson_id);
        }
        return Number(left.sort_order || 0) - Number(right.sort_order || 0);
      });
  }, [questionLessonFilter, questionTrackFilter, questions]);

  const filteredLearners = useMemo(() => {
    const query = learnerQuery.trim().toLowerCase();
    const rows = [...learnerOverview].sort((left, right) => {
      const xpDelta = Number(right.xp || 0) - Number(left.xp || 0);
      if (xpDelta !== 0) {
        return xpDelta;
      }
      return Number(right.streak || 0) - Number(left.streak || 0);
    });

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [row.user_id, row.name, row.role, row.member_type]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [learnerOverview, learnerQuery]);

  const filteredProgressRows = useMemo(() => {
    const query = progressQuery.trim().toLowerCase();
    if (!query) {
      return progressRows;
    }

    return progressRows.filter((row) =>
      [row.user_name, row.user_id, row.track, row.lesson_id]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [progressQuery, progressRows]);

  const filteredActivityRows = useMemo(() => {
    const query = activityQuery.trim().toLowerCase();
    if (!query) {
      return activityRows;
    }

    return activityRows.filter((row) =>
      [row.user_name, row.user_id, row.track, row.lesson_id, row.action]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [activityQuery, activityRows]);

  const selectedLearner =
    learnerOverview.find((row) => row.user_id === selectedLearnerId) || null;
  const selectedProgress =
    progressRows.find((row) => row.id === selectedProgressId) || null;
  const selectedActivity =
    activityRows.find((row) => row.id === selectedActivityId) || null;

  const communityLessonsCount = useMemo(
    () => lessons.filter((lesson) => lesson.status !== "Archived").length,
    [lessons],
  );

  const curatedUnits = useMemo(
    () => flattenCuratedUnits(curatedCourseDetail),
    [curatedCourseDetail],
  );

  async function loadAll(nextMode: "initial" | "refresh" = "initial") {
    const base = getApiBase();

    if (nextMode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [
        tracksRes,
        lessonsRes,
        questionsRes,
        overviewRes,
        progressRes,
        activityRes,
        catalogRes,
        analyticsRes,
      ] = await Promise.all([
        fetch(`${base}/api/academy/admin/tracks`, { headers }),
        fetch(`${base}/api/academy/admin/lessons`, { headers }),
        fetch(`${base}/api/academy/admin/questions`, { headers }),
        fetch(`${base}/api/academy/admin/overview`, { headers }),
        fetch(`${base}/api/academy/admin/progress`, { headers }),
        fetch(`${base}/api/academy/admin/activity`, { headers }),
        fetch(`${base}/api/academy/admin/v2/catalog`, { headers }),
        fetch(`${base}/api/academy/admin/v2/analytics`, { headers }),
      ]);

      const [
        tracksJson,
        lessonsJson,
        questionsJson,
        overviewJson,
        progressJson,
        activityJson,
        catalogJson,
        analyticsJson,
      ] = await Promise.all([
        tracksRes.json(),
        lessonsRes.json(),
        questionsRes.json(),
        overviewRes.json(),
        progressRes.json(),
        activityRes.json(),
        catalogRes.json(),
        analyticsRes.json(),
      ]);

      if (!tracksRes.ok) throw new Error(tracksJson?.message || "Failed to load tracks.");
      if (!lessonsRes.ok) throw new Error(lessonsJson?.message || "Failed to load lessons.");
      if (!questionsRes.ok) throw new Error(questionsJson?.message || "Failed to load questions.");
      if (!overviewRes.ok) throw new Error(overviewJson?.message || "Failed to load learners.");
      if (!progressRes.ok) throw new Error(progressJson?.message || "Failed to load progress.");
      if (!activityRes.ok) throw new Error(activityJson?.message || "Failed to load activity.");
      if (!catalogRes.ok) throw new Error(catalogJson?.message || "Failed to load curated catalog.");
      if (!analyticsRes.ok) throw new Error(analyticsJson?.message || "Failed to load academy analytics.");

      setTracks((tracksJson.data || []).map(normalizeAcademyTrack));
      setLessons((lessonsJson.data || []).map(normalizeAcademyLesson));
      setQuestions((questionsJson.data || []).map(normalizeAcademyQuestion));
      setLearnerOverview(overviewJson.data || []);
      setProgressRows(progressJson.data || []);
      setActivityRows(activityJson.data || []);
      setCuratedPaths(catalogJson.data?.curated_paths || []);
      setCommunityTrackSummaries(catalogJson.data?.community_tracks || []);
      setCuratedAnalytics(analyticsJson.data || null);
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to load academy admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAll("initial");
  }, [headers]);

  useEffect(() => {
    if (creatingTrack) {
      return;
    }

    const selected = tracks.find((row) => row.id === selectedTrackId) || tracks[0] || null;
    if (!selected) {
      setSelectedTrackId(null);
      setTrackForm(createEmptyTrackForm());
      return;
    }
    if (selected.id !== selectedTrackId) {
      setSelectedTrackId(selected.id);
    }
    setTrackForm(trackToForm(selected));
  }, [creatingTrack, selectedTrackId, tracks]);

  useEffect(() => {
    if (creatingLesson) {
      return;
    }

    const selected =
      lessons.find((row) => row.id === selectedLessonId) || lessons[0] || null;
    if (!selected) {
      setSelectedLessonId(null);
      setLessonForm(createEmptyLessonForm(lessonTrackFilter || trackOptions[0]?.id || ""));
      return;
    }
    if (selected.id !== selectedLessonId) {
      setSelectedLessonId(selected.id);
    }
    setLessonForm(lessonToForm(selected));
  }, [creatingLesson, lessonTrackFilter, lessons, selectedLessonId, trackOptions]);

  useEffect(() => {
    if (creatingQuestion) {
      return;
    }

    const selected =
      questions.find((row) => row.id === selectedQuestionId) || questions[0] || null;
    if (!selected) {
      setSelectedQuestionId(null);
      setQuestionForm(
        createEmptyQuestionForm(
          questionTrackFilter || trackOptions[0]?.id || "",
          questionLessonFilter,
        ),
      );
      return;
    }
    if (selected.id !== selectedQuestionId) {
      setSelectedQuestionId(selected.id);
    }
    setQuestionForm(questionToForm(selected));
  }, [
    creatingQuestion,
    questionLessonFilter,
    questionTrackFilter,
    questions,
    selectedQuestionId,
    trackOptions,
  ]);

  useEffect(() => {
    if (!learnerOverview.length) {
      setSelectedLearnerId(null);
      return;
    }
    if (!selectedLearnerId || !learnerOverview.some((row) => row.user_id === selectedLearnerId)) {
      setSelectedLearnerId(learnerOverview[0].user_id);
    }
  }, [learnerOverview, selectedLearnerId]);

  useEffect(() => {
    if (!progressRows.length) {
      setSelectedProgressId(null);
      return;
    }
    if (!selectedProgressId || !progressRows.some((row) => row.id === selectedProgressId)) {
      setSelectedProgressId(progressRows[0].id);
    }
  }, [progressRows, selectedProgressId]);

  useEffect(() => {
    if (!activityRows.length) {
      setSelectedActivityId(null);
      return;
    }
    if (!selectedActivityId || !activityRows.some((row) => row.id === selectedActivityId)) {
      setSelectedActivityId(activityRows[0].id);
    }
  }, [activityRows, selectedActivityId]);

  useEffect(() => {
    const firstCourseId = curatedPaths[0]?.courses[0]?.id || "";
    const hasCourse = curatedPaths.some((path) =>
      path.courses.some((course) => course.id === selectedCuratedCourseId),
    );

    if (!selectedCuratedCourseId || !hasCourse) {
      setSelectedCuratedCourseId(firstCourseId);
    }
  }, [curatedPaths, selectedCuratedCourseId]);

  useEffect(() => {
    if (!selectedCuratedCourseId) {
      setCuratedCourseDetail(null);
      return;
    }

    const base = getApiBase();
    let cancelled = false;

    async function loadCourse() {
      setCuratedCourseLoading(true);
      try {
        const response = await fetch(
          `${base}/api/academy/admin/v2/course/${selectedCuratedCourseId}`,
          { headers },
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Failed to load curated course.");
        }
        if (!cancelled) {
          setCuratedCourseDetail(result.data || null);
        }
      } catch (courseError: any) {
        if (!cancelled) {
          setError(courseError?.message || "Failed to load curated course.");
        }
      } finally {
        if (!cancelled) {
          setCuratedCourseLoading(false);
        }
      }
    }

    void loadCourse();
    return () => {
      cancelled = true;
    };
  }, [headers, selectedCuratedCourseId]);

  useEffect(() => {
    if (!curatedCourseDetail) {
      setSelectedCuratedUnitId("");
      return;
    }

    const units = flattenCuratedUnits(curatedCourseDetail);
    const hasUnit = units.some((unit) => unit.id === selectedCuratedUnitId);
    if (!selectedCuratedUnitId || !hasUnit) {
      setSelectedCuratedUnitId(units[0]?.id || "");
    }
  }, [curatedCourseDetail, selectedCuratedUnitId]);

  useEffect(() => {
    if (!curatedCourseDetail || !selectedCuratedUnitId) {
      setCuratedUnitDetail(null);
      return;
    }

    const base = getApiBase();
    let cancelled = false;

    async function loadUnit() {
      setCuratedUnitLoading(true);
      try {
        const params = new URLSearchParams({
          course_id: curatedCourseDetail.id,
          unit_id: selectedCuratedUnitId,
        });
        const response = await fetch(`${base}/api/academy/admin/v2/unit?${params}`, {
          headers,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Failed to load curated unit.");
        }
        if (!cancelled) {
          setCuratedUnitDetail(result.data || null);
        }
      } catch (unitError: any) {
        if (!cancelled) {
          setError(unitError?.message || "Failed to load curated unit.");
        }
      } finally {
        if (!cancelled) {
          setCuratedUnitLoading(false);
        }
      }
    }

    void loadUnit();
    return () => {
      cancelled = true;
    };
  }, [curatedCourseDetail, headers, selectedCuratedUnitId]);

  async function saveTrack() {
    const base = getApiBase();
    setTrackSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        id: normalizeTrackId(trackForm.id),
        title: trackForm.title.trim(),
        subtitle: trackForm.subtitle.trim(),
        description: trackForm.description.trim(),
        status: trackForm.status,
        sort_order: Number(trackForm.sort_order || 0),
      };

      const endpoint = creatingTrack
        ? `${base}/api/academy/admin/tracks`
        : `${base}/api/academy/admin/tracks/${selectedTrackId}`;
      const method = creatingTrack ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to save track.");
      }

      toast.success(creatingTrack ? "Track created" : "Track updated");
      setNotice(creatingTrack ? "Track created successfully." : "Track updated successfully.");
      setCreatingTrack(false);
      await loadAll("refresh");
      if (result?.data?.id) {
        setSelectedTrackId(result.data.id);
      }
    } catch (saveError: any) {
      const message = saveError?.message || "Failed to save track.";
      setError(message);
      toast.error(message);
    } finally {
      setTrackSaving(false);
    }
  }

  async function deleteTrack() {
    if (!selectedTrackId || creatingTrack) {
      return;
    }

    const base = getApiBase();
    setTrackDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${base}/api/academy/admin/tracks/${selectedTrackId}`, {
        method: "DELETE",
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete track.");
      }
      toast.success("Track deleted");
      setNotice("Track deleted successfully.");
      await loadAll("refresh");
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete track.";
      setError(message);
      toast.error(message);
    } finally {
      setTrackDeleting(false);
    }
  }

  async function saveLesson() {
    const base = getApiBase();
    setLessonSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        track: normalizeTrackId(lessonForm.track),
        lesson_id: lessonForm.lesson_id.trim(),
        title: lessonForm.title.trim(),
        minutes: Number(lessonForm.minutes || 10),
        content_md: lessonForm.content_md,
        callouts: parseCalloutsText(lessonForm.callouts_text),
        status: lessonForm.status,
        sort_order: Number(lessonForm.sort_order || 0),
      };

      const endpoint = creatingLesson
        ? `${base}/api/academy/admin/lessons`
        : `${base}/api/academy/admin/lessons/${selectedLessonId}`;
      const method = creatingLesson ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to save lesson.");
      }

      toast.success(creatingLesson ? "Lesson created" : "Lesson updated");
      setNotice(
        creatingLesson
          ? "Lesson created successfully."
          : "Lesson updated successfully.",
      );
      setCreatingLesson(false);
      await loadAll("refresh");
      if (result?.data?.id) {
        setSelectedLessonId(result.data.id);
      }
    } catch (saveError: any) {
      const message = saveError?.message || "Failed to save lesson.";
      setError(message);
      toast.error(message);
    } finally {
      setLessonSaving(false);
    }
  }

  async function deleteLesson() {
    if (!selectedLessonId || creatingLesson) {
      return;
    }

    const base = getApiBase();
    setLessonDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${base}/api/academy/admin/lessons/${selectedLessonId}`, {
        method: "DELETE",
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete lesson.");
      }
      toast.success("Lesson deleted");
      setNotice("Lesson deleted successfully.");
      await loadAll("refresh");
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete lesson.";
      setError(message);
      toast.error(message);
    } finally {
      setLessonDeleting(false);
    }
  }

  async function saveQuestion() {
    const base = getApiBase();
    setQuestionSaving(true);
    setError("");
    setNotice("");

    try {
      const validChoices = questionForm.choices
        .map((choice) => ({
          id: choice.id.trim(),
          label: choice.label.trim(),
        }))
        .filter((choice) => choice.id && choice.label);

      if (validChoices.length < 2) {
        throw new Error("Add at least two valid answer choices.");
      }

      const payload = {
        track: normalizeTrackId(questionForm.track),
        lesson_id: questionForm.lesson_id.trim(),
        prompt: questionForm.prompt.trim(),
        choices: validChoices,
        correct_choice_id: questionForm.correct_choice_id.trim(),
        explanation: questionForm.explanation.trim(),
        sort_order: Number(questionForm.sort_order || 0),
        status: questionForm.status,
      };

      const endpoint = creatingQuestion
        ? `${base}/api/academy/admin/questions`
        : `${base}/api/academy/admin/questions/${selectedQuestionId}`;
      const method = creatingQuestion ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to save question.");
      }

      toast.success(creatingQuestion ? "Question created" : "Question updated");
      setNotice(
        creatingQuestion
          ? "Question created successfully."
          : "Question updated successfully.",
      );
      setCreatingQuestion(false);
      await loadAll("refresh");
      if (result?.data?.id) {
        setSelectedQuestionId(result.data.id);
      }
    } catch (saveError: any) {
      const message = saveError?.message || "Failed to save question.";
      setError(message);
      toast.error(message);
    } finally {
      setQuestionSaving(false);
    }
  }

  async function deleteQuestion() {
    if (!selectedQuestionId || creatingQuestion) {
      return;
    }

    const base = getApiBase();
    setQuestionDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${base}/api/academy/admin/questions/${selectedQuestionId}`,
        {
          method: "DELETE",
          headers,
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete question.");
      }
      toast.success("Question deleted");
      setNotice("Question deleted successfully.");
      await loadAll("refresh");
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete question.";
      setError(message);
      toast.error(message);
    } finally {
      setQuestionDeleting(false);
    }
  }

  async function deleteProgressRow() {
    if (!selectedProgressId) {
      return;
    }

    const base = getApiBase();
    setProgressDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${base}/api/academy/admin/progress/${selectedProgressId}`,
        {
          method: "DELETE",
          headers,
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete progress row.");
      }
      toast.success("Progress row deleted");
      setNotice("Progress row deleted successfully.");
      await loadAll("refresh");
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete progress row.";
      setError(message);
      toast.error(message);
    } finally {
      setProgressDeleting(false);
    }
  }

  async function deleteActivityRow() {
    if (!selectedActivityId) {
      return;
    }

    const base = getApiBase();
    setActivityDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${base}/api/academy/admin/activity/${selectedActivityId}`,
        {
          method: "DELETE",
          headers,
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete activity row.");
      }
      toast.success("Activity row deleted");
      setNotice("Activity row deleted successfully.");
      await loadAll("refresh");
    } catch (deleteError: any) {
      const message = deleteError?.message || "Failed to delete activity row.";
      setError(message);
      toast.error(message);
    } finally {
      setActivityDeleting(false);
    }
  }

  const tabs = [
    { id: "curated" as const, label: "Curated", count: curatedPaths.length },
    { id: "tracks" as const, label: "Tracks", count: tracks.length },
    { id: "lessons" as const, label: "Lessons", count: lessons.length },
    { id: "questions" as const, label: "Questions", count: questions.length },
    { id: "learners" as const, label: "Learners", count: learnerOverview.length },
    { id: "progress" as const, label: "Progress", count: progressRows.length },
    { id: "activity" as const, label: "Activity", count: activityRows.length },
  ];

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <AdminEmptyState
          title="Loading academy control plane"
          description="Fetching curated catalog, community tables, learner progress, and academy activity."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10 md:space-y-10 md:py-14">
      <AdminHero
        eyebrow="Academy Control Plane"
        title="Academy Admin"
        subtitle="Browse curated curriculum, manage community learning tables, and inspect the live progress and activity data that drive the academy experience."
        actions={
          <ActionButton
            type="button"
            variant="secondary"
            onClick={() => void loadAll("refresh")}
            disabled={refreshing}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {refreshing ? "Refreshing" : "Refresh"}
            </span>
          </ActionButton>
        }
        metrics={
          <>
            <AdminMetricCard
              label="Curated Paths"
              value={curatedPaths.length}
              meta={`${curatedPaths.reduce((sum, path) => sum + Number(path.course_count || 0), 0)} curated courses`}
              icon={<Layers3 className="h-5 w-5" />}
              tone="primary"
            />
            <AdminMetricCard
              label="Community Tracks"
              value={tracks.length}
              meta={`${communityLessonsCount} live lessons`}
              icon={<Route className="h-5 w-5" />}
            />
            <AdminMetricCard
              label="Learners"
              value={learnerOverview.length}
              meta={`${progressRows.length} progress rows`}
              icon={<Users className="h-5 w-5" />}
            />
            <AdminMetricCard
              label="Question Bank"
              value={questions.length}
              meta={`${activityRows.length} activity logs`}
              icon={<Trophy className="h-5 w-5" />}
              tone="accent"
            />
          </>
        }
      />

      {error ? <AdminNotice tone="error" message={error} /> : null}
      {notice ? <AdminNotice tone="success" message={notice} /> : null}

      <AdminTabs
        tabs={tabs}
        active={activeTab}
        onChange={(value) => setActiveTab(value as AcademyTab)}
      />

      {activeTab === "curated" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <div className="space-y-6">
              <AdminPanel
                eyebrow="Curated Browser"
                title="Paths and Courses"
                description="Curated academy content is code-driven, so this browser gives you context before you inspect unit details or analytics."
              >
                <div className="space-y-5">
                  {curatedPaths.map((path) => (
                    <div key={path.id} className="border border-border-main bg-main-bg p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-heading text-2xl font-black uppercase tracking-tight text-text-main">
                            {path.title}
                          </div>
                          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                            {path.course_count} courses • {path.total_unit_count} units • {path.difficulty}
                          </div>
                        </div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                          {path.tag}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {path.courses.map((course) => (
                          <AdminListButton
                            key={course.id}
                            title={course.title}
                            meta={`${course.module_count} modules • ${course.total_unit_count} units • ${course.duration_hours}h`}
                            active={selectedCuratedCourseId === course.id}
                            onClick={() => setSelectedCuratedCourseId(course.id)}
                            badges={
                              <div className="flex flex-wrap gap-2">
                                {course.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>

              <AdminPanel
                eyebrow="Analytics"
                title="Lane Split"
                description="This roll-up shows where learner progress is actually flowing between curated paths and community tracks."
              >
                {curatedAnalytics ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="border border-border-main bg-main-bg p-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          Curated Lane
                        </div>
                        <div className="mt-2 font-heading text-3xl font-black uppercase tracking-tight text-text-main">
                          {curatedAnalytics.lane_split.curated_rows}
                        </div>
                        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          {curatedAnalytics.lane_split.curated_learners} learners • {curatedAnalytics.lane_split.curated_xp} XP
                        </div>
                      </div>
                      <div className="border border-border-main bg-main-bg p-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          Community Lane
                        </div>
                        <div className="mt-2 font-heading text-3xl font-black uppercase tracking-tight text-text-main">
                          {curatedAnalytics.lane_split.community_rows}
                        </div>
                        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          {curatedAnalytics.lane_split.community_learners} learners • {curatedAnalytics.lane_split.community_xp} XP
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                          Top Paths
                        </div>
                        {curatedAnalytics.top_paths.map((path) => (
                          <div key={path.id} className="border border-border-main bg-main-bg px-4 py-3">
                            <div className="font-heading text-lg font-black uppercase tracking-tight text-text-main">
                              {path.title}
                            </div>
                            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                              {path.completions} completions • {path.practice_completions} practice • {path.learner_count} learners
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                          Top Courses
                        </div>
                        {curatedAnalytics.top_courses.map((course) => (
                          <div key={course.id} className="border border-border-main bg-main-bg px-4 py-3">
                            <div className="font-heading text-lg font-black uppercase tracking-tight text-text-main">
                              {course.title}
                            </div>
                            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                              {course.completions} completions • {course.practice_completions} practice • {course.learner_count} learners
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <AdminEmptyState
                    title="No curated analytics"
                    description="Analytics data will appear once progress rows exist."
                  />
                )}
              </AdminPanel>
            </div>

            <div className="space-y-6">
              <AdminPanel
                eyebrow="Course Detail"
                title={curatedCourseDetail?.title || "Curated Course"}
                description={
                  curatedCourseLoading
                    ? "Loading selected curated course."
                    : curatedCourseDetail?.description || "Select a curated course to inspect its module and unit structure."
                }
              >
                {curatedCourseDetail ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="border border-border-main bg-main-bg px-3 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                          Modules
                        </div>
                        <div className="mt-1 font-heading text-2xl font-black uppercase tracking-tight text-text-main">
                          {curatedCourseDetail.module_count}
                        </div>
                      </div>
                      <div className="border border-border-main bg-main-bg px-3 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                          Learn Units
                        </div>
                        <div className="mt-1 font-heading text-2xl font-black uppercase tracking-tight text-text-main">
                          {curatedCourseDetail.learn_unit_count}
                        </div>
                      </div>
                      <div className="border border-border-main bg-main-bg px-3 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                          Practice
                        </div>
                        <div className="mt-1 font-heading text-2xl font-black uppercase tracking-tight text-text-main">
                          {curatedCourseDetail.practice_unit_count}
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[320px] space-y-3 overflow-auto pr-1">
                      {curatedUnits.map((unit) => (
                        <AdminListButton
                          key={unit.id}
                          title={unit.title}
                          meta={`${unit.moduleTitle} • ${unit.type} • ${unit.xp_reward} XP`}
                          active={selectedCuratedUnitId === unit.id}
                          onClick={() => setSelectedCuratedUnitId(unit.id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <AdminEmptyState
                    title="No curated course selected"
                    description="Choose a course from the curated path browser to inspect it."
                  />
                )}
              </AdminPanel>

              <AdminPanel
                eyebrow="Unit Detail"
                title={curatedUnitDetail?.title || "Curated Unit"}
                description={
                  curatedUnitLoading
                    ? "Loading selected unit."
                    : curatedUnitDetail
                      ? `${curatedUnitDetail.module_title} • ${curatedUnitDetail.type} • ${curatedUnitDetail.xp_reward} XP`
                      : "Select a unit to inspect lesson or challenge detail."
                }
              >
                {curatedUnitDetail ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="border border-border-main bg-main-bg px-4 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                          Language
                        </div>
                        <div className="mt-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-text-main">
                          {curatedUnitDetail.language || "Content"}
                        </div>
                      </div>
                      <div className="border border-border-main bg-main-bg px-4 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                          Tests / Hints
                        </div>
                        <div className="mt-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-text-main">
                          {curatedUnitDetail.tests.length} tests • {curatedUnitDetail.hints.length} hints
                        </div>
                      </div>
                    </div>

                    <div className="border border-border-main bg-main-bg px-4 py-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Content Preview
                      </div>
                      <div className="mt-3 font-mono text-xs leading-6 tracking-[0.04em] text-text-main">
                        {extractPreviewText(curatedUnitDetail.content_md || "") || "No content preview."}
                      </div>
                    </div>

                    {communityTrackSummaries.length > 0 ? (
                      <div className="border border-border-main bg-main-bg px-4 py-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          Community Lane Snapshot
                        </div>
                        <div className="mt-3 grid gap-3">
                          {communityTrackSummaries.slice(0, 4).map((track) => (
                            <div key={track.id} className="flex items-center justify-between gap-3 bg-surface px-3 py-3">
                              <div>
                                <div className="font-heading text-base font-black uppercase tracking-tight text-text-main">
                                  {track.title}
                                </div>
                                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                                  {track.lesson_count} lessons • {track.total_minutes} minutes
                                </div>
                              </div>
                              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                                community
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <AdminEmptyState
                    title="No curated unit selected"
                    description="Choose a unit from the course detail browser to inspect it."
                  />
                )}
              </AdminPanel>
            </div>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "tracks" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Community Table"
              title="Tracks"
              description="Tracks are the top-level community learning lanes stored in the database."
              actions={
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setCreatingTrack(true);
                    setSelectedTrackId(null);
                    setTrackForm(createEmptyTrackForm());
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Track
                  </span>
                </ActionButton>
              }
            >
              <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                {trackOptions.length > 0 ? (
                  trackOptions.map((track) => (
                    <AdminListButton
                      key={track.id}
                      title={track.title}
                      meta={`${track.id} • ${track.status} • sort ${track.sort_order}`}
                      active={!creatingTrack && selectedTrackId === track.id}
                      onClick={() => {
                        setCreatingTrack(false);
                        setSelectedTrackId(track.id);
                      }}
                    />
                  ))
                ) : (
                  <AdminEmptyState
                    title="No community tracks"
                    description="Create the first track to open a community learning lane."
                  />
                )}
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow={creatingTrack ? "Create Row" : "Edit Row"}
              title="Track Editor"
              description="Track rows define the lane metadata used by community lessons and learner progress."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton type="button" variant="primary" onClick={() => void saveTrack()} disabled={trackSaving}>
                    <span className="inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {trackSaving ? "Saving" : creatingTrack ? "Create" : "Save"}
                    </span>
                  </ActionButton>
                  {!creatingTrack ? (
                    <ActionButton type="button" variant="danger" onClick={() => void deleteTrack()} disabled={trackDeleting}>
                      <span className="inline-flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        {trackDeleting ? "Deleting" : "Delete"}
                      </span>
                    </ActionButton>
                  ) : null}
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Track ID" hint="slug">
                  <input value={trackForm.id} onChange={(event) => setTrackForm((current) => ({ ...current, id: normalizeTrackId(event.target.value) }))} className={adminInputClass} disabled={!creatingTrack} />
                </AdminField>
                <AdminField label="Sort Order">
                  <input value={trackForm.sort_order} onChange={(event) => setTrackForm((current) => ({ ...current, sort_order: event.target.value }))} className={adminInputClass} />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminField label="Title">
                    <input value={trackForm.title} onChange={(event) => setTrackForm((current) => ({ ...current, title: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                </div>
                <div className="md:col-span-2">
                  <AdminField label="Subtitle">
                    <input value={trackForm.subtitle} onChange={(event) => setTrackForm((current) => ({ ...current, subtitle: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                </div>
                <div className="md:col-span-2">
                  <AdminField label="Description">
                    <textarea value={trackForm.description} onChange={(event) => setTrackForm((current) => ({ ...current, description: event.target.value }))} className={adminTextareaClass} />
                  </AdminField>
                </div>
                <AdminField label="Status">
                  <select value={trackForm.status} onChange={(event) => setTrackForm((current) => ({ ...current, status: event.target.value as PublishStatus }))} className={adminSelectClass}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </AdminField>
              </div>
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "lessons" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Community Table"
              title="Lessons"
              description="Lessons hold markdown content, minutes, status, and callouts for community tracks."
              actions={
                <div className="flex flex-wrap gap-3">
                  <select
                    value={lessonTrackFilter}
                    onChange={(event) => setLessonTrackFilter(event.target.value)}
                    className={adminSelectClass}
                  >
                    <option value="">All tracks</option>
                    {trackOptions.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.title}
                      </option>
                    ))}
                  </select>
                  <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCreatingLesson(true);
                      setSelectedLessonId(null);
                      setLessonForm(createEmptyLessonForm(lessonTrackFilter || trackOptions[0]?.id || ""));
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Lesson
                    </span>
                  </ActionButton>
                </div>
              }
            >
              <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                {filteredLessons.length > 0 ? (
                  filteredLessons.map((lesson) => (
                    <AdminListButton
                      key={lesson.id}
                      title={lesson.title}
                      meta={`${lesson.track} / ${lesson.lesson_id} • ${lesson.minutes} min • ${lesson.status}`}
                      active={!creatingLesson && selectedLessonId === lesson.id}
                      onClick={() => {
                        setCreatingLesson(false);
                        setSelectedLessonId(lesson.id);
                      }}
                    />
                  ))
                ) : (
                  <AdminEmptyState
                    title="No lessons in scope"
                    description="Change the filter or create a new lesson for the selected track."
                  />
                )}
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow={creatingLesson ? "Create Row" : "Edit Row"}
              title="Lesson Editor"
              description="Content is saved as markdown. Callouts use a JSON array of title/body objects."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton type="button" variant="primary" onClick={() => void saveLesson()} disabled={lessonSaving}>
                    <span className="inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {lessonSaving ? "Saving" : creatingLesson ? "Create" : "Save"}
                    </span>
                  </ActionButton>
                  {!creatingLesson ? (
                    <ActionButton type="button" variant="danger" onClick={() => void deleteLesson()} disabled={lessonDeleting}>
                      <span className="inline-flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        {lessonDeleting ? "Deleting" : "Delete"}
                      </span>
                    </ActionButton>
                  ) : null}
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Track">
                  <select value={lessonForm.track} onChange={(event) => setLessonForm((current) => ({ ...current, track: event.target.value }))} className={adminSelectClass}>
                    <option value="">Select track</option>
                    {trackOptions.map((track) => (
                      <option key={track.id} value={track.id}>{track.title}</option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="Lesson ID">
                  <input value={lessonForm.lesson_id} onChange={(event) => setLessonForm((current) => ({ ...current, lesson_id: event.target.value }))} className={adminInputClass} />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminField label="Title">
                    <input value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} className={adminInputClass} />
                  </AdminField>
                </div>
                <AdminField label="Minutes">
                  <input value={lessonForm.minutes} onChange={(event) => setLessonForm((current) => ({ ...current, minutes: event.target.value }))} className={adminInputClass} />
                </AdminField>
                <AdminField label="Sort Order">
                  <input value={lessonForm.sort_order} onChange={(event) => setLessonForm((current) => ({ ...current, sort_order: event.target.value }))} className={adminInputClass} />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminField label="Markdown Content">
                    <textarea value={lessonForm.content_md} onChange={(event) => setLessonForm((current) => ({ ...current, content_md: event.target.value }))} className={adminTextareaClass} />
                  </AdminField>
                </div>
                <div className="md:col-span-2">
                  <AdminField label="Callouts JSON">
                    <textarea value={lessonForm.callouts_text} onChange={(event) => setLessonForm((current) => ({ ...current, callouts_text: event.target.value }))} className={adminTextareaClass} />
                  </AdminField>
                </div>
                <AdminField label="Status">
                  <select value={lessonForm.status} onChange={(event) => setLessonForm((current) => ({ ...current, status: event.target.value as PublishStatus }))} className={adminSelectClass}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </AdminField>
              </div>
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "questions" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Community Table"
              title="Questions"
              description="Question rows power community quiz experiences. Keep choice IDs stable and map the correct answer precisely."
              actions={
                <div className="flex flex-wrap gap-3">
                  <select value={questionTrackFilter} onChange={(event) => setQuestionTrackFilter(event.target.value)} className={adminSelectClass}>
                    <option value="">All tracks</option>
                    {trackOptions.map((track) => (
                      <option key={track.id} value={track.id}>{track.title}</option>
                    ))}
                  </select>
                  <input
                    value={questionLessonFilter}
                    onChange={(event) => setQuestionLessonFilter(event.target.value)}
                    placeholder="lesson id filter"
                    className={adminInputClass}
                  />
                  <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCreatingQuestion(true);
                      setSelectedQuestionId(null);
                      setQuestionForm(
                        createEmptyQuestionForm(
                          questionTrackFilter || trackOptions[0]?.id || "",
                          questionLessonFilter,
                        ),
                      );
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Question
                    </span>
                  </ActionButton>
                </div>
              }
            >
              <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question) => (
                    <AdminListButton
                      key={question.id}
                      title={question.prompt}
                      meta={`${question.track} / ${question.lesson_id} • ${question.status} • sort ${question.sort_order}`}
                      active={!creatingQuestion && selectedQuestionId === question.id}
                      onClick={() => {
                        setCreatingQuestion(false);
                        setSelectedQuestionId(question.id);
                      }}
                    />
                  ))
                ) : (
                  <AdminEmptyState
                    title="No questions in scope"
                    description="Change the filters or create a new question."
                  />
                )}
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow={creatingQuestion ? "Create Row" : "Edit Row"}
              title="Question Editor"
              description="Question choices stay in the same row. Use a compact set of IDs like a, b, c to keep the answer key obvious."
              actions={
                <div className="flex flex-wrap gap-3">
                  <ActionButton type="button" variant="primary" onClick={() => void saveQuestion()} disabled={questionSaving}>
                    <span className="inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {questionSaving ? "Saving" : creatingQuestion ? "Create" : "Save"}
                    </span>
                  </ActionButton>
                  {!creatingQuestion ? (
                    <ActionButton type="button" variant="danger" onClick={() => void deleteQuestion()} disabled={questionDeleting}>
                      <span className="inline-flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        {questionDeleting ? "Deleting" : "Delete"}
                      </span>
                    </ActionButton>
                  ) : null}
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Track">
                  <select value={questionForm.track} onChange={(event) => setQuestionForm((current) => ({ ...current, track: event.target.value }))} className={adminSelectClass}>
                    <option value="">Select track</option>
                    {trackOptions.map((track) => (
                      <option key={track.id} value={track.id}>{track.title}</option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="Lesson ID">
                  <input value={questionForm.lesson_id} onChange={(event) => setQuestionForm((current) => ({ ...current, lesson_id: event.target.value }))} className={adminInputClass} />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminField label="Prompt">
                    <textarea value={questionForm.prompt} onChange={(event) => setQuestionForm((current) => ({ ...current, prompt: event.target.value }))} className={adminTextareaClass} />
                  </AdminField>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                    Choices
                  </div>
                  {questionForm.choices.map((choice, index) => (
                    <div key={`${choice.id}-${index}`} className="grid gap-3 border border-border-main bg-main-bg p-3 md:grid-cols-[120px_minmax(0,1fr)_auto]">
                      <input
                        value={choice.id}
                        onChange={(event) =>
                          setQuestionForm((current) => ({
                            ...current,
                            choices: current.choices.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, id: event.target.value }
                                : entry,
                            ),
                          }))
                        }
                        className={adminInputClass}
                      />
                      <input
                        value={choice.label}
                        onChange={(event) =>
                          setQuestionForm((current) => ({
                            ...current,
                            choices: current.choices.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, label: event.target.value }
                                : entry,
                            ),
                          }))
                        }
                        className={adminInputClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuestionForm((current) => ({
                            ...current,
                            choices:
                              current.choices.length <= 2
                                ? current.choices
                                : current.choices.filter((_, entryIndex) => entryIndex !== index),
                          }))
                        }
                        className="inline-flex h-11 items-center justify-center border border-border-main bg-surface px-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-main"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setQuestionForm((current) => ({
                        ...current,
                        choices: [
                          ...current.choices,
                          {
                            id: String.fromCharCode(97 + current.choices.length),
                            label: "",
                          },
                        ],
                      }))
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Choice
                    </span>
                  </ActionButton>
                </div>
                <AdminField label="Correct Choice ID">
                  <input value={questionForm.correct_choice_id} onChange={(event) => setQuestionForm((current) => ({ ...current, correct_choice_id: event.target.value }))} className={adminInputClass} />
                </AdminField>
                <AdminField label="Sort Order">
                  <input value={questionForm.sort_order} onChange={(event) => setQuestionForm((current) => ({ ...current, sort_order: event.target.value }))} className={adminInputClass} />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminField label="Explanation">
                    <textarea value={questionForm.explanation} onChange={(event) => setQuestionForm((current) => ({ ...current, explanation: event.target.value }))} className={adminTextareaClass} />
                  </AdminField>
                </div>
                <AdminField label="Status">
                  <select value={questionForm.status} onChange={(event) => setQuestionForm((current) => ({ ...current, status: event.target.value as PublishStatus }))} className={adminSelectClass}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </AdminField>
              </div>
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "learners" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Live Overview"
              title="Learners"
              description="This aggregates raw progress and activity into the live member-level academy view."
            >
              <div className="space-y-4">
                <input
                  value={learnerQuery}
                  onChange={(event) => setLearnerQuery(event.target.value)}
                  placeholder="Search learner by name, id, role, or type"
                  className={adminInputClass}
                />
                <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                  {filteredLearners.length > 0 ? (
                    filteredLearners.map((row) => (
                      <AdminListButton
                        key={row.user_id}
                        title={row.name}
                        meta={`${row.role} • ${row.member_type} • ${row.completed_lessons} lessons`}
                        active={selectedLearnerId === row.user_id}
                        onClick={() => setSelectedLearnerId(row.user_id)}
                        badges={
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                              {row.xp} XP
                            </span>
                            <span className="bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                              {row.streak || 0}d streak
                            </span>
                          </div>
                        }
                      />
                    ))
                  ) : (
                    <AdminEmptyState
                      title="No learners"
                      description="No academy learner data is available for the current filter."
                    />
                  )}
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow="Derived View"
              title={selectedLearner?.name || "Learner Detail"}
              description={
                selectedLearner
                  ? `${selectedLearner.role} • ${selectedLearner.member_type} • last active ${formatDateTime(selectedLearner.last_activity)}`
                  : "Select a learner to inspect the aggregated academy state."
              }
            >
              {selectedLearner ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        XP
                      </div>
                      <div className="mt-1 font-heading text-3xl font-black uppercase tracking-tight text-text-main">
                        {selectedLearner.xp}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Streak
                      </div>
                      <div className="mt-1 font-heading text-3xl font-black uppercase tracking-tight text-text-main">
                        {selectedLearner.streak || 0}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Lessons
                      </div>
                      <div className="mt-1 font-heading text-3xl font-black uppercase tracking-tight text-text-main">
                        {selectedLearner.completed_lessons}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Quizzes
                      </div>
                      <div className="mt-1 font-heading text-3xl font-black uppercase tracking-tight text-text-main">
                        {selectedLearner.quiz_passed}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Progress rows
                      </div>
                      <div className="mt-3 space-y-2">
                        {progressRows
                          .filter((row) => row.user_id === selectedLearner.user_id)
                          .slice(0, 6)
                          .map((row) => (
                            <div key={row.id} className="bg-surface px-3 py-3">
                              <div className="font-heading text-sm font-black uppercase tracking-tight text-text-main">
                                {row.track} / {row.lesson_id}
                              </div>
                              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                                {row.xp_awarded} XP • {formatDateTime(row.updated_at)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Recent activity
                      </div>
                      <div className="mt-3 space-y-2">
                        {activityRows
                          .filter((row) => row.user_id === selectedLearner.user_id)
                          .slice(0, 6)
                          .map((row) => (
                            <div key={row.id} className="bg-surface px-3 py-3">
                              <div className="font-heading text-sm font-black uppercase tracking-tight text-text-main">
                                {row.action}
                              </div>
                              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                                {row.track} / {row.lesson_id} • {formatDateTime(row.recorded_at)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <AdminEmptyState
                  title="No learner selected"
                  description="Pick a learner from the overview list to inspect the aggregated data."
                />
              )}
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "progress" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Raw Table"
              title="Progress Rows"
              description="Inspect the exact rows used to build learner XP, completion, and curated/community path state."
            >
              <div className="space-y-4">
                <input
                  value={progressQuery}
                  onChange={(event) => setProgressQuery(event.target.value)}
                  placeholder="Search by learner, track, or lesson"
                  className={adminInputClass}
                />
                <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                  {filteredProgressRows.length > 0 ? (
                    filteredProgressRows.map((row) => (
                      <AdminListButton
                        key={row.id}
                        title={`${row.user_name} • ${row.track}`}
                        meta={`${row.lesson_id} • ${row.xp_awarded} XP • ${formatDateTime(row.updated_at)}`}
                        active={selectedProgressId === row.id}
                        onClick={() => setSelectedProgressId(row.id)}
                      />
                    ))
                  ) : (
                    <AdminEmptyState
                      title="No progress rows"
                      description="No progress rows match the current query."
                    />
                  )}
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow="Row Inspector"
              title="Progress Detail"
              description="Delete is available here for cleanup of malformed or stale rows."
              actions={
                selectedProgress ? (
                  <ActionButton type="button" variant="danger" onClick={() => void deleteProgressRow()} disabled={progressDeleting}>
                    <span className="inline-flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      {progressDeleting ? "Deleting" : "Delete Row"}
                    </span>
                  </ActionButton>
                ) : null
              }
            >
              {selectedProgress ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        User
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedProgress.user_name}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Track
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedProgress.track}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Lesson
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedProgress.lesson_id}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        XP
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedProgress.xp_awarded}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Completion Flags
                      </div>
                      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-main">
                        lesson_completed: {String(selectedProgress.lesson_completed)}<br />
                        quiz_passed: {String(selectedProgress.quiz_passed)}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Updated
                      </div>
                      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-main">
                        {formatDateTime(selectedProgress.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="border border-border-main bg-main-bg p-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                      Checklist Snapshot
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedProgress.checklist || []).map((value, index) => (
                        <span key={`${selectedProgress.id}-check-${index}`} className="bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-main">
                          {index + 1}: {value ? "done" : "open"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <AdminEmptyState
                  title="No progress row selected"
                  description="Choose a row from the progress list to inspect it."
                />
              )}
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}

      {activeTab === "activity" ? (
        <AdminPageSection>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
            <AdminPanel
              eyebrow="Raw Table"
              title="Activity Rows"
              description="These rows drive recent history, streak qualification, and the academy timeline."
            >
              <div className="space-y-4">
                <input
                  value={activityQuery}
                  onChange={(event) => setActivityQuery(event.target.value)}
                  placeholder="Search by learner, action, track, or lesson"
                  className={adminInputClass}
                />
                <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                  {filteredActivityRows.length > 0 ? (
                    filteredActivityRows.map((row) => (
                      <AdminListButton
                        key={row.id}
                        title={`${row.user_name} • ${row.action}`}
                        meta={`${row.track} / ${row.lesson_id} • ${formatDateTime(row.recorded_at)}`}
                        active={selectedActivityId === row.id}
                        onClick={() => setSelectedActivityId(row.id)}
                      />
                    ))
                  ) : (
                    <AdminEmptyState
                      title="No activity rows"
                      description="No activity rows match the current query."
                    />
                  )}
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow="Row Inspector"
              title="Activity Detail"
              description="Use delete carefully here. Removing a row can alter streak history and learner timelines."
              actions={
                selectedActivity ? (
                  <ActionButton type="button" variant="danger" onClick={() => void deleteActivityRow()} disabled={activityDeleting}>
                    <span className="inline-flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      {activityDeleting ? "Deleting" : "Delete Row"}
                    </span>
                  </ActionButton>
                ) : null
              }
            >
              {selectedActivity ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        User
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedActivity.user_name}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Action
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedActivity.action}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Track
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedActivity.track}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                        Lesson
                      </div>
                      <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight text-text-main">
                        {selectedActivity.lesson_id}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Recorded At
                      </div>
                      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-main">
                        {formatDateTime(selectedActivity.recorded_at)}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        XP Snapshot
                      </div>
                      <div className="mt-3 font-heading text-3xl font-black uppercase tracking-tight text-text-main">
                        {selectedActivity.xp_snapshot}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Completion Flags
                      </div>
                      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-main">
                        lesson_completed: {String(selectedActivity.lesson_completed)}<br />
                        quiz_passed: {String(selectedActivity.quiz_passed)}
                      </div>
                    </div>
                    <div className="border border-border-main bg-main-bg p-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        Checklist
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedActivity.checklist || []).map((value, index) => (
                          <span key={`${selectedActivity.id}-activity-check-${index}`} className="bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-main">
                            {index + 1}: {value ? "done" : "open"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <AdminEmptyState
                  title="No activity row selected"
                  description="Choose a row from the activity list to inspect it."
                />
              )}
            </AdminPanel>
          </div>
        </AdminPageSection>
      ) : null}
    </div>
  );
}
