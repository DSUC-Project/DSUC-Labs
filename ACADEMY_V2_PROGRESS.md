# Academy V2 Progress

Updated: 2026-04-29
Owner: Codex
Goal: Rebuild DSUC Academy with Superteam-like UX and learning flow while keeping DSUC auth, backend, progress, and activity as the system of record.

## Overall

- Estimated completion toward the agreed scope: `100%`
- Current phase: `Completed for the agreed DSUC + Superteam-like scope`
- Current product state:
  - Curated paths/course/module/unit flow exists and is the primary Academy route
  - Progress and activity sync into DSUC exists
  - Browser runner exists for JS-like curated challenges
  - Rust guided labs and Anchor scaffold labs now have local verifier support
  - Curated catalog/course/unit responses now cache in the browser to reduce repeat content fetches
  - Legacy community tracks remain available under a separate namespace by design, not as the primary learner flow

## Workstreams

### 1. Catalog + Information Architecture

- [x] Curated academy catalog loaded from local seed
- [x] Path -> Course -> Module -> Unit hierarchy exposed through backend API
- [x] Community tracks shown alongside curated paths
- [x] Curated Academy v2 is the primary learner flow while the old flat model lives only as a separate community lane

### 2. Learner UX

- [x] `/academy` catalog redesign
- [x] Path detail page
- [x] Course journey page
- [x] Lesson / practice unit shell
- [x] Practice playground feels like a proper workbench
- [x] Legacy community lane moved under its own route namespace
- [x] Responsive shell pass for the full Academy v2 route set

### 3. Progress + Activity

- [x] Curated units write progress to DSUC
- [x] Unit completion unlocks route progression
- [x] Practice completion can be gated by browser-run checks
- [x] Deeper learning analytics for Academy v2 in admin control plane

### 4. Challenge Runtime

- [x] Browser runner for JS-like curated practice units
- [x] Visible + hidden test reporting in learner UI
- [x] Rich run output / solution lane / better playground ergonomics
- [x] Rust/buildable lab runtime with local verifier coverage

### 5. Admin + Content Ops

- [x] Read-only admin overview for curated paths and learner metrics
- [x] Read-only browser for curated paths / courses / modules / units
- [x] Export flow for curated Academy v2 snapshot
- [x] Production cutover to curated-first Academy with community lane retained intentionally

## Latest Updates

- [2026-04-28] Created this progress tracker to keep Academy v2 scope and completion visible inside the repo.
- [2026-04-28] Upgraded the practice workspace into a workbench with `Editor / Results / Solution` tabs, richer run output, draft-state badges, and spoiler-gated reference solution flow.
- [2026-04-28] Added in-workbench run action plus `Cmd/Ctrl + Enter` shortcut so learners can execute checks without leaving the editor lane.
- [2026-04-28] Expanded `AcademyAdmin` into an Academy control plane with curated-path overview, learner metrics, and clearer separation between Academy v2 and legacy community tracks.
- [2026-04-28] Added legacy-lane banners to community track learner pages so users can distinguish old DSUC content flow from the new Academy v2 path/course/unit flow.
- [2026-04-28] Moved legacy community content to `/academy/community/...` while keeping old `/academy/track/...` and `/academy/learn/...` URLs as compatibility redirects.
- [2026-04-28] Added recent learner activity timeline to `AcademyAdmin` so academy ops can watch progress writes and completions without querying the database manually.
- [2026-04-28] Added a dedicated admin curated-catalog endpoint so `AcademyAdmin` no longer depends on learner-facing `academy_access` gates to render the Academy v2 control plane.
- [2026-04-29] Added local verifier coverage for guided Rust labs and buildable Anchor scaffold labs, so practice completion can now be gated beyond the JS-like challenge set.
- [2026-04-29] Updated the learner practice shell to surface runtime-specific labels like `Guided Rust verifier` and `Rust scaffold verifier` instead of treating every lab like a browser-only runner.
- [2026-04-29] Added a curated content browser in `AcademyAdmin` so ops can inspect seeded paths, courses, modules, units, starter code, and tests without leaving DSUC.
- [2026-04-29] Added curated Academy analytics in admin, including lane split, top paths, and top courses from DSUC progress data.
- [2026-04-29] Added browser-side caching for curated catalog/course/unit responses to reduce repeated Academy content fetches and preserve egress.
- [2026-04-29] Smoke-tested the verifier on seed starter code and seed solution code across JS-like, guided Rust, and Anchor scaffold lessons.
- [2026-04-29] Simplified the Academy course and unit shells to reduce UI noise by removing duplicated route-status panels and shortening explanatory copy.
- [2026-04-29] Reworked the practice editor and solution surfaces to use calmer dark-neutral code panels with higher-contrast text instead of the previous neon-heavy styling.
- [2026-04-29] Opened Academy learner read routes to guests so curated content and community track reading no longer require sign-in; DB progress/activity sync still stays authenticated.
