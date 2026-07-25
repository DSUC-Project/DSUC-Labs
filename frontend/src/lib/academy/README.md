# Frontend Academy modules

## Curated (v2 seed)

Content source of truth: `backend/content/academy-v2/seed/` (Vite alias `@academy-v2-seed`).

| Module | Role |
|--------|------|
| `v2Api.ts` | Fetch/cache curated catalog, course, unit (API + local seed fallback) |
| `v2LocalCatalog.ts` | Bundled seed loader |
| `v2Progress.ts` | Progress key helpers for curated units |
| `challengeRunner.ts` | In-browser challenge tests for units |
| `academyLocale.ts` / `academyTranslations.generated.ts` | VI/EN localization for curated content |

Used by: `AcademyHome`, `AcademyPath`, `AcademyCourse`, `AcademyUnit`.

## Community (Supabase-backed)

| Module | Role |
|--------|------|
| `catalog.ts` | Normalize community track/lesson rows |
| `progress.ts` / `checklist.ts` / `questions.ts` | Local + server progress, checklists, quizzes |
| `useAcademyProgress.ts` / `useAcademyStudyTimer.ts` | Shared progress + study timer hooks |

Used by: `AcademyTrack`, `AcademyLesson`, parts of `AcademyAdmin`.

## Shared

| Module | Role |
|--------|------|
| `md.tsx` | Markdown rendering (uses `CodeSurface`) |

Do not reintroduce a second seed tree under `frontend/src/content/`.
