# DSUC Lab Backend

Express + TypeScript API (mock DB or Supabase). Wallet + Google auth, club data, Academy.

## Local (mock, no Supabase)

```bash
cd backend
npm install
cp .env.example.local .env
npm run dev
# or: npm run dev:mock
```

- API: http://localhost:3001  
- Health: `GET /api/health`

```bash
npm run build && npm start
npm run seed
```

## Env

Local: see `.env.example.local` (`USE_MOCK_DB=true`, `PORT`, `FRONTEND_URL`).

Production (`.env.example.deployment`):

| Variable | Purpose |
|----------|---------|
| `USE_MOCK_DB=false` | Use Supabase |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Database |
| `FRONTEND_URL` | CORS + wallet sign-in domain |
| `JWT_SECRET` | **Strong secret in production** |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth |
| `IMAGEBB_API_KEY` | Optional uploads |

Supabase setup: run `database/schema.sql` (+ needed `migration_*.sql`), then `seed.sql` if needed. Create a public Storage bucket `avatars` for profile images. RLS scripts live under `database/` if you need them.

## Auth

Production login is **Google only**. Local mock login is for development.

`x-wallet-address` alone is rejected (not an auth method).  
`POST /api/members/auth` and wallet challenge login → **410 Gone**.  
`members.wallet_address` remains optional **profile data** only.

Call protected routes with:

```http
Authorization: Bearer <token>
```

(Cookie `auth_token` also works when cookies are sent.)

| Method | Notes |
|--------|--------|
| Google | `POST /api/auth/google/login` or OAuth `/api/auth/google` |
| Local mock | `POST /api/auth/dev-login` — mock DB + non-prod + local host only |
| Session | `GET /api/auth/session`, `POST /api/auth/logout` |
| Agent key | `x-dsuc-agent-key` or `Authorization: Agent <key>` |

Code: `src/routes/auth.ts`, `src/middleware/auth.ts`, `src/lib/googleAuth.ts`.

Member ids are student IDs (text), e.g. `101240059` — not UUIDs. Community accounts may use `community-*`.

## Route prefixes

`/api/health`, `/bootstrap`, `/auth`, `/members`, `/projects`, `/events`, `/finance`, `/finance-history`, `/work`, `/resources`, `/contact`, `/academy`, `/admin`.

Academy learner progress/stats need JWT. Curated content seed for validation: `content/academy-v2/seed/`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Wallet header rejected | Sign in with Google; send JWT |
| `/api/members/auth` 410 | Use `/api/auth/google/login` |
| CORS | Check `FRONTEND_URL` and allowlist in `src/index.ts` |
| Avatar upload fails | Public `avatars` bucket + policies in Supabase |
