# DSUC Lab Backend

Express + TypeScript API (Supabase). Google auth, club data, Academy.

## Local

```bash
cd backend
npm install
cp .env.example.local .env
# fill Supabase + Google values
npm run dev
```

- API: http://localhost:3001  
- Health: `GET /api/health`

```bash
npm run build && npm start
```

## Env

Local: see `.env.example.local` (`PORT`, `FRONTEND_URL`, Supabase, Google).

Production (`.env.example.deployment`):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or service role) | Database |
| `FRONTEND_URL` | CORS |
| `JWT_SECRET` | **Strong secret in production** |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth |
| `IMAGEBB_API_KEY` | Required only if ImageBB upload helpers are used (no hardcoded fallback) |

Supabase setup: run `database/schema.sql` (+ needed `migration_*.sql`), then `seed.sql` if needed. Create a public Storage bucket `avatars` for profile images. RLS scripts live under `database/` if you need them.

## Auth

Production login is **Google only**.

`x-wallet-address` alone is rejected (not an auth method).  
`POST /api/members/auth` → **410 Gone**.  
`members.wallet_address` remains optional **profile data** only.

Call protected routes with:

```http
Authorization: Bearer <token>
```

(Cookie `auth_token` also works when cookies are sent.)

| Method | Notes |
|--------|--------|
| Google | `POST /api/auth/google/login` or OAuth `/api/auth/google` |
| Session | `GET /api/auth/session`, `POST /api/auth/logout` |
| Agent key | `x-dsuc-agent-key` or `Authorization: Agent <key>` |

Code: `src/routes/auth.ts`, `src/middleware/auth.ts`, `src/lib/googleAuth.ts`.

Member ids are student IDs (text), e.g. `101240059` — not UUIDs. Community accounts may use `community-*`.

## Route prefixes

`/api/health`, `/bootstrap`, `/auth`, `/members`, `/projects`, `/events`, `/finance`, `/finance-history`, `/work`, `/resources`, `/contact`, `/academy`, `/admin`.

Academy learner progress/stats need JWT. Curated content seed (edit only): `content/academy-v2/seed/` — see `content/academy-v2/README.md`. Frontend loads the same files via `@academy-v2-seed` (no second copy). Seed edits that should appear in the learner UI still require a frontend rebuild/redeploy.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Wallet header rejected | Sign in with Google; send JWT |
| `/api/members/auth` 410 | Use `/api/auth/google/login` |
| CORS | Check `FRONTEND_URL` and allowlist in `src/index.ts` |
| DB errors | Ensure Supabase env vars are set and schema is applied |
