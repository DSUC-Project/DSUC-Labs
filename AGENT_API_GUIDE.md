# DSUC Backend API Guide (Agent-Ready)

Last updated: 2026-04-28  
Backend base URL (production): `https://dsuc-lab-backend.onrender.com`

## 1) Quick Start

### 1.1 Base URL
- All endpoints below are prefixed with:
  - `https://dsuc-lab-backend.onrender.com`

### 1.2 Standard response shape
- Success:
```json
{
  "success": true,
  "data": {},
  "message": "optional",
  "count": 0
}
```
- Error:
```json
{
  "error": "Bad Request | Unauthorized | Forbidden | Not Found | Database Error | Internal Server Error",
  "message": "human readable detail"
}
```

### 1.3 Auth methods (important)
For routes using `authenticateUser`, backend supports 3 auth inputs:

1. Agent key (highest priority)
- Header: `x-dsuc-agent-key: <KEY>`
- Or: `Authorization: Agent <KEY>`

2. Wallet auth
- Header: `x-wallet-address: <SOLANA_WALLET>`

3. Google JWT auth
- Header: `Authorization: Bearer <JWT>`
- Or cookie: `auth_token`

Auth priority inside backend:
1. Agent key
2. Wallet header
3. Bearer/cookie token

## 2) Roles & Permission Rules

### 2.1 Member type
- `member_type = member`: official member
- `member_type = community`: community user

### 2.2 Role gates used in backend
- `requireOfficialMember`: must be official member (`member_type = member`)
- `requireAdmin`: official member + role in:
  - `President`, `Vice-President`, `Tech-Lead`, `Media-Lead`
- `requireExecutiveAdmin`: official member + role in:
  - `President`, `Vice-President`
- `requireAcademyAccess`: `academy_access != false`

### 2.3 Agent key caveat
- Current implementation stores `scopes` metadata but does **not** enforce scope checks at middleware level yet.
- Treat scopes as documentation/governance today.

## 3) Global Enums / Conventions

### 3.1 Publish status
- `Draft`, `Published`, `Archived`

### 3.2 Work/Bounty status
- `Open`, `In Progress`, `Completed`, `Closed`

### 3.3 Academy action
- `started`, `checklist_updated`, `lesson_completed`, `quiz_passed`, `progress_updated`, `lesson_reviewed`

### 3.4 Entity sets
- `admin/content/:entity` supports entity:
  - `events`, `projects`, `resources`, `repos`, `bounties`

## 4) Endpoint Catalog (Full)

## 4.1 Health

### GET `/api/health`
- Auth: none
- Purpose: service health check

---

## 4.2 Auth

### POST `/api/auth/wallet`
- Auth: none
- Body:
```json
{ "wallet_address": "..." }
```
- Rule:
  - wallet must exist in `members` and `is_active = true`

### GET `/api/auth/google`
- Auth: none
- Purpose: start Google OAuth redirect flow

### GET `/api/auth/google/callback`
- Auth: OAuth callback
- Purpose:
  - complete OAuth
  - set `auth_token` cookie
  - redirect to frontend

### POST `/api/auth/google/link`
- Auth: none (payload-based, for linking flow)
- Body required:
```json
{
  "wallet_address": "...",
  "email": "...",
  "google_id": "..."
}
```
- Rules:
  - wallet account must exist
  - email cannot belong to another user
  - sets `auth_provider = both`, `email_verified = true`

### POST `/api/auth/google/login`
- Auth: none
- Body required:
```json
{
  "email": "...",
  "google_id": "...",
  "name": "...",
  "avatar": "...",
  "intent": "login | signup"
}
```
- Rules:
  - if `intent=login` and account not found => 404
  - if `intent=signup` and account not found => auto create community account
  - returns JWT token in response field `token`

### GET `/api/auth/session`
- Auth: `Bearer <JWT>` or cookie `auth_token`
- Purpose: session validity + current member data

### POST `/api/auth/logout`
- Auth: optional
- Purpose: clear cookie `auth_token`

---

## 4.3 Members

### GET `/api/members`
- Auth: none
- Returns active members + academy stats

### GET `/api/members/admin/list`
- Auth: `authenticateUser` + `requireExecutiveAdmin`
- Returns full user list for admin management

### POST `/api/members/admin/users`
- Auth: executive admin
- Body minimal:
```json
{
  "name": "User Name",
  "member_type": "member | community",
  "role": "Member",
  "email": "optional",
  "wallet_address": "optional"
}
```
- Rules:
  - `name` required
  - community forces role `Community`
  - `auth_provider` auto-computed from wallet/email

### PATCH `/api/members/admin/users/:id`
- Auth: executive admin
- Purpose: update user profile/access/type/role/active
- Important:
  - `auth_provider` recalculated automatically

### DELETE `/api/members/admin/users/:id`
- Auth: executive admin
- Rules:
  - cannot delete self
  - nulls `created_by` references in events/projects/resources/bounties/repos first

### GET `/api/members/:id`
- Auth: none
- Returns one active member

### POST `/api/members/auth`
- Auth: none
- Body:
```json
{ "wallet_address": "..." }
```
- Legacy wallet auth endpoint (similar to `/api/auth/wallet`)

### PUT `/api/members/:id`
- Auth: `authenticateUser`
- Rule:
  - user can only update own profile (`req.user.id === :id`)
- Accepts fields:
  - `name`, `skills`, `socials`, `profile_completed`
  - `bankInfo` or `bank_info`
  - `avatar` URL or base64 image

### GET `/api/members/wallet/:wallet_address`
- Auth: none
- Returns active member by wallet

---

## 4.4 Projects

### GET `/api/projects`
- Auth: none
- Query:
  - `category` (optional)
- Returns `status=Published` only

### GET `/api/projects/:id`
- Auth: none
- Returns published project by ID

### POST `/api/projects`
- Auth: official member
- Body minimal:
```json
{
  "name": "Project Name"
}
```
- Optional:
  - `description`, `category`, `builders`, `link`, `repo_link`, `image_url`
- Rules:
  - `name` required
  - status auto `Published`
  - supports base64 `image_url` upload

### PUT `/api/projects/:id`
- Auth: official member
- Rule:
  - creator or admin (`President|Vice-President|Tech-Lead`) only

### DELETE `/api/projects/:id`
- Auth: official member
- Rule:
  - admin role only (`President|Vice-President|Tech-Lead`)

---

## 4.5 Events

### GET `/api/events`
- Auth: none
- Query:
  - `upcoming=true|false` (optional)
  - `limit=<number>` (optional)
- Returns `status=Published`

### GET `/api/events/recent`
- Auth: none
- Returns top 3 nearest upcoming published events

### GET `/api/events/:id`
- Auth: none
- Returns one published event

### POST `/api/events`
- Auth: official member
- Body required:
```json
{
  "title": "Event title",
  "date": "YYYY-MM-DD"
}
```
- Optional: `time`, `type`, `location`
- Rules:
  - status auto `Published`
  - attendees starts at `0`

### PUT `/api/events/:id`
- Auth: official member
- Rule:
  - creator or admin (`President|Vice-President|Tech-Lead|Media-Lead`)

### DELETE `/api/events/:id`
- Auth: official member
- Rule:
  - only admin roles above

### POST `/api/events/:id/register`
- Auth: authenticated user
- Purpose: increment `attendees` by 1

---

## 4.6 Resources

### GET `/api/resources`
- Auth: none
- Query optional:
  - `category`
  - `type`
- Returns `status=Published`

### GET `/api/resources/categories`
- Auth: none
- Returns category counts for published resources

### GET `/api/resources/:id`
- Auth: none
- Returns one published resource

### POST `/api/resources`
- Auth: official member
- Required:
```json
{
  "name": "Resource name",
  "url": "https://..."
}
```
- Optional: `type`, `size`, `category`
- Rules:
  - status auto `Published`

### PUT `/api/resources/:id`
- Auth: official member
- Rule:
  - creator or admin (`President|Vice-President|Tech-Lead|Media-Lead`)

### DELETE `/api/resources/:id`
- Auth: official member
- Rule:
  - admin roles only

---

## 4.7 Work (Bounties & Repos)

### Bounties

### GET `/api/work/bounties`
- Auth: none
- Query optional: `status`

### GET `/api/work/bounties/:id`
- Auth: none

### POST `/api/work/bounties`
- Auth: official member
- Required:
```json
{ "title": "..." }
```
- Optional:
  - `description`, `reward`, `difficulty`, `tags`, `submitLink`
- Rules:
  - status defaults `Open`
  - `submitLink` stored as `submit_link`

### PUT `/api/work/bounties/:id`
- Auth: official member
- Rule:
  - creator or admin (`President|Vice-President|Tech-Lead`)
- Accepts:
  - `title`, `description`, `reward`, `difficulty`, `tags`, `status`, `submitLink|submit_link`

### DELETE `/api/work/bounties/:id`
- Auth: official member
- Rule:
  - admin roles only (`President|Vice-President|Tech-Lead`)

### Repos

### GET `/api/work/repos`
- Auth: none
- Returns published repos ordered by stars desc

### GET `/api/work/repos/:id`
- Auth: none
- Returns published repo by ID

### POST `/api/work/repos`
- Auth: official member
- Required:
```json
{ "name": "..." }
```
- Optional:
  - `description`, `language`, `url`, `stars`, `forks`
- Rules:
  - status auto `Published`

### PUT `/api/work/repos/:id`
- Auth: official member
- Rule:
  - creator or admin (`President|Vice-President|Tech-Lead`)

### DELETE `/api/work/repos/:id`
- Auth: official member
- Rule:
  - admin roles only (`President|Vice-President|Tech-Lead`)

---

## 4.8 Finance

### POST `/api/finance/request`
- Auth: official member
- Required:
```json
{
  "amount": "number/string",
  "reason": "..."
}
```
- Optional:
  - `date` (`YYYY-MM-DD`, defaults today)
  - `bill_image` (URL or base64)
- Rules:
  - status starts `pending`

### GET `/api/finance/pending`
- Auth: official member + executive admin

### GET `/api/finance/history`
- Auth: official member
- Returns requests with status in `completed|rejected`

### GET `/api/finance/my-requests`
- Auth: official member

### GET `/api/finance/request/:id`
- Auth: official member
- Returns finance request + `requester_bank_info`

### POST `/api/finance/approve/:id`
- Auth: official member + executive admin
- Rule:
  - request must currently be `pending`
- Effects:
  - request status -> `completed`
  - writes 1 row to `finance_history`

### POST `/api/finance/reject/:id`
- Auth: official member + executive admin
- Rule:
  - request must currently be `pending`
- Effects:
  - request status -> `rejected`
  - writes 1 row to `finance_history`

### GET `/api/finance/members-with-bank`
- Auth: official member
- Returns active official members having bank account info

---

## 4.9 Finance History

### GET `/api/finance-history`
- Auth: none
- Returns public finance ledger

### POST `/api/finance-history`
- Auth: executive admin
- Required:
```json
{
  "requester_id": "...",
  "requester_name": "...",
  "amount": "...",
  "status": "completed | rejected"
}
```
- Optional:
  - `reason`, `date`, `bill_image`

---

## 4.10 Academy

## Learner-facing

### GET `/api/academy/catalog`
- Auth: authenticated + academy access
- Returns published tracks with published lessons

### GET `/api/academy/questions`
- Auth: authenticated + academy access
- Query:
  - `track` (optional)
  - `lesson_id` or `lessonId` (optional)
- Returns published questions only

### GET `/api/academy/progress`
- Auth: authenticated + academy access
- Returns all progress rows of current user + total xp

### POST `/api/academy/progress`
- Auth: authenticated + academy access
- Required:
```json
{
  "track": "string",
  "lesson_id": "string"
}
```
- Optional:
  - `lesson_completed` (bool-like)
  - `quiz_passed` (bool-like)
  - `checklist` (bool array)
  - `xp_awarded` (number)
  - `record_review` (bool-like)
- Hard validation:
  - `(track, lesson_id)` must exist in `academy_lessons`
- Effects:
  - upsert into `academy_progress`
  - insert into `academy_activity` when state actually changes

## Academy admin (Executive only)

### Tracks
- `GET /api/academy/admin/tracks`
- `POST /api/academy/admin/tracks`
- `PATCH /api/academy/admin/tracks/:id`
- `DELETE /api/academy/admin/tracks/:id`

Track create required:
```json
{
  "id": "slug-track-id",
  "title": "Track title"
}
```
Optional:
- `subtitle`, `description`, `status`, `sort_order`

### Lessons
- `GET /api/academy/admin/lessons`
  - query optional: `track`
- `POST /api/academy/admin/lessons`
- `PATCH /api/academy/admin/lessons/:id`
- `DELETE /api/academy/admin/lessons/:id`

Lesson create required:
```json
{
  "track": "existing-track-id",
  "lesson_id": "module-1",
  "title": "Lesson title"
}
```
Optional:
- `minutes` (> 0)
- `content_md`
- `callouts` (array)
- `status`, `sort_order`

### Questions
- `GET /api/academy/admin/questions`
- `POST /api/academy/admin/questions`
- `PATCH /api/academy/admin/questions/:id`
- `DELETE /api/academy/admin/questions/:id`

Question create required:
```json
{
  "track": "track-id",
  "lesson_id": "module-1",
  "prompt": "question",
  "choices": [
    { "id": "a", "label": "..." },
    { "id": "b", "label": "..." }
  ],
  "correct_choice_id": "a"
}
```
Optional:
- `explanation`
- `status`
- `sort_order`

Hard validation:
- `track` non-empty
- `lesson_id` non-empty
- `prompt` non-empty
- `choices.length >= 2`
- `correct_choice_id` must exist in choices
- `(track, lesson_id)` must exist in `academy_lessons`

### Analytics / history
- `GET /api/academy/admin/overview`
- `GET /api/academy/admin/history`

---

## 4.11 Global Admin

### GET `/api/admin/overview`
- Auth: executive admin
- Returns aggregated content and finance sets:
  - `events`, `projects`, `resources`, `bounties`, `repos`
  - `finance_requests`, `finance_history`

### PATCH `/api/admin/content/:entity/:id/status`
- Auth: executive admin
- `entity` must be one of:
  - `events`, `projects`, `resources`, `repos`, `bounties`
- Body:
```json
{ "status": "..." }
```
- Allowed status per entity:
  - events/projects/resources/repos: `Draft|Published|Archived`
  - bounties: `Open|In Progress|Completed|Closed`

### DELETE `/api/admin/content/:entity/:id`
- Auth: executive admin
- Supported entities:
  - `events`, `projects`, `resources`, `repos`, `bounties`

### Agent key management
- `GET /api/admin/agent-keys`
- `POST /api/admin/agent-keys`
- `PATCH /api/admin/agent-keys/:id`
- `DELETE /api/admin/agent-keys/:id`

Create key body:
```json
{
  "name": "academy-bot-prod",
  "scopes": ["*"]
}
```
- Response includes raw `key` once.

Patch body options:
```json
{
  "name": "new-name",
  "scopes": ["academy:*"],
  "is_active": true,
  "rotate": true
}
```
- If `rotate=true`, response includes new raw `key`.

---

## 4.12 Contact

### POST `/api/contact`
- Auth: none
- Body:
```json
{
  "name": "at least 2 chars",
  "message": "at least 10 chars"
}
```
- Rate limit:
  - max 5 requests / IP / hour
- Behavior:
  - tries sending email via Resend
  - may still return success even if email provider fails

---

## 5) Agent Execution Rules (Recommended)

These are operational rules for autonomous agents (not all are hard-enforced by backend, but strongly recommended for data quality).

## 5.1 General safety
- Always `GET` before `PUT/PATCH/DELETE` to verify record exists.
- Never delete in bulk unless explicit user confirmation.
- For destructive endpoints:
  - read object label/title first
  - log reason for deletion in your own task log.
- For status changes:
  - prefer `Draft -> Published -> Archived` lifecycle.

## 5.2 Academy content publishing policy

### Track publication checklist
Before setting a track to `Published`, ensure:
1. Track has at least 1 lesson.
2. Every published lesson in that track has at least 3 published quiz questions.
3. Each question has:
   - at least 3 choices recommended (`>=2` is API minimum),
   - one valid `correct_choice_id`,
   - non-empty explanation.
4. Lesson ordering (`sort_order`) is contiguous and deterministic.

### Recommended strict minimum for quiz quality
- Per lesson:
  - Minimum 3 questions
  - Minimum 3 choices/question
  - No duplicate question prompt in same lesson
  - Choices IDs normalized to `a,b,c,d...`

### Suggested publish flow
1. `POST /api/academy/admin/tracks` with `status=Draft`
2. `POST /api/academy/admin/lessons` with `status=Draft`
3. `POST /api/academy/admin/questions` (>=3 each lesson, status Draft)
4. Patch questions -> `Published`
5. Patch lessons -> `Published`
6. Patch track -> `Published`
7. Verify with `GET /api/academy/catalog`

## 5.3 Finance process policy
- Approve/reject only when request is still `pending`.
- Do not call `/approve/:id` or `/reject/:id` repeatedly.
- If endpoint returns already processed, stop and fetch latest state.

## 5.4 Auth policy for agents
- In production automation use **only agent key header**.
- Do not rely on wallet headers for server-to-server workflows.
- Rotate keys periodically (`PATCH /api/admin/agent-keys/:id` with `rotate=true`).

---

## 6) Curl Snippets

### 6.1 Use agent key
```bash
curl -H "x-dsuc-agent-key: YOUR_KEY" \
  https://dsuc-lab-backend.onrender.com/api/admin/agent-keys
```

### 6.2 Create academy track
```bash
curl -X POST https://dsuc-lab-backend.onrender.com/api/academy/admin/tracks \
  -H "Content-Type: application/json" \
  -H "x-dsuc-agent-key: YOUR_KEY" \
  -d '{
    "id":"solana-foundation",
    "title":"Solana Foundation",
    "subtitle":"Core path",
    "description":"...",
    "status":"Draft",
    "sort_order":1
  }'
```

### 6.3 Create lesson
```bash
curl -X POST https://dsuc-lab-backend.onrender.com/api/academy/admin/lessons \
  -H "Content-Type: application/json" \
  -H "x-dsuc-agent-key: YOUR_KEY" \
  -d '{
    "track":"solana-foundation",
    "lesson_id":"module-1",
    "title":"Blockchain as a Computer",
    "minutes":15,
    "content_md":"# Intro",
    "callouts":[{"title":"Key","body":"..."}],
    "status":"Draft",
    "sort_order":1
  }'
```

### 6.4 Create question
```bash
curl -X POST https://dsuc-lab-backend.onrender.com/api/academy/admin/questions \
  -H "Content-Type: application/json" \
  -H "x-dsuc-agent-key: YOUR_KEY" \
  -d '{
    "track":"solana-foundation",
    "lesson_id":"module-1",
    "prompt":"What is Solana runtime executing?",
    "choices":[
      {"id":"a","label":"Transactions"},
      {"id":"b","label":"Docker containers"},
      {"id":"c","label":"Web servers"}
    ],
    "correct_choice_id":"a",
    "explanation":"Runtime executes instructions from transactions.",
    "status":"Draft",
    "sort_order":1
  }'
```

### 6.5 Publish track after readiness checks
```bash
curl -X PATCH https://dsuc-lab-backend.onrender.com/api/academy/admin/tracks/solana-foundation \
  -H "Content-Type: application/json" \
  -H "x-dsuc-agent-key: YOUR_KEY" \
  -d '{"status":"Published"}'
```

---

## 7) Notes for Integrators

- `POST /api/auth/google/login` and `POST /api/members/auth` are both used in current frontend flows.
- For academy learner UI:
  - source of truth is now DB catalog/questions/progress endpoints.
- If route is missing, server responds:
```json
{
  "error": "Not Found",
  "message": "Route <METHOD> <PATH> not found"
}
```

---

## 8) Question File Spec (to ensure agent maps exact track)

Use **JSON** (recommended), one file per track.  
File naming suggestion: `academy-track.<track-id>.json`

### 8.1 Canonical format
```json
{
  "schema_version": "1.0",
  "track": {
    "id": "solana-foundation",
    "title": "Solana Foundation",
    "subtitle": "Core path",
    "description": "Track description",
    "status": "Draft",
    "sort_order": 1
  },
  "rules": {
    "min_questions_per_lesson": 3,
    "min_choices_per_question": 3
  },
  "lessons": [
    {
      "track_id": "solana-foundation",
      "lesson_id": "module-1",
      "title": "Blockchain as a Computer",
      "minutes": 15,
      "content_md": "# Lesson content...",
      "callouts": [
        { "title": "Key", "body": "..." }
      ],
      "status": "Draft",
      "sort_order": 1,
      "questions": [
        {
          "track_id": "solana-foundation",
          "lesson_id": "module-1",
          "prompt": "What does Solana runtime execute?",
          "choices": [
            { "id": "a", "label": "Transaction instructions" },
            { "id": "b", "label": "Docker containers" },
            { "id": "c", "label": "Web pages" }
          ],
          "correct_choice_id": "a",
          "explanation": "Runtime executes transaction instructions.",
          "status": "Draft",
          "sort_order": 1
        }
      ]
    }
  ]
}
```

### 8.2 Why this format prevents wrong-track inserts
1. Track ID appears in 3 places:
   - `track.id`
   - `lesson.track_id`
   - `question.track_id`
2. Agent must assert all 3 are equal before calling API.
3. Question also repeats `lesson_id`, so mismatch is caught early.

### 8.3 Import validation checklist (agent must enforce)
1. `track.id` must be slug-safe (lowercase + hyphen).
2. Every lesson `track_id` must equal `track.id`.
3. Every question `track_id` and `lesson_id` must match parent lesson.
4. Every lesson must contain at least `rules.min_questions_per_lesson` questions (recommend 3).
5. Every question must have at least `rules.min_choices_per_question` choices (recommend 3).
6. `correct_choice_id` must exist in that question’s `choices`.
7. `lesson_id` unique within one track.
8. `sort_order` should be contiguous (1,2,3...).

### 8.4 Backend constraints to remember
- Backend normalizes `track` via:
  - lower-case
  - replace non `[a-z0-9-]` with `-`
- `lesson_id` is only trimmed (not slug-normalized), so keep lesson IDs consistent manually.
- API minimums:
  - question choices: `>= 2` (but recommended `>= 3`)
  - lesson minutes: `> 0`

### 8.5 API call order for import
1. `POST /api/academy/admin/tracks` (or PATCH if exists)
2. `POST /api/academy/admin/lessons` for each lesson
3. `POST /api/academy/admin/questions` for each question
4. Optional final publish:
   - patch questions -> `Published`
   - patch lessons -> `Published`
   - patch track -> `Published`
