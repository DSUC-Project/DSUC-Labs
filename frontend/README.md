# DSUC Lab Frontend

React + Vite app. Needs the backend API.

## Local

```bash
cd frontend
npm install
cp .env.example.local .env
npm run dev
```

- App: http://localhost:5173  
- Point `VITE_API_BASE_URL` at the backend (default `http://localhost:3001`)

```bash
npm run build
npm run preview
```

## Env

| Variable | Notes |
|----------|--------|
| `VITE_API_BASE_URL` | Backend origin |
| `VITE_FRONTEND_URL` | This app origin |
| `VITE_GOOGLE_CLIENT_ID` | Google login button |

Templates: `.env.example.local`, `.env.example.deployment`. Restart Vite after env changes.

## Auth (client)

Production login is **Google only**. Do not send bare `x-wallet-address` as auth.

| Method | Flow |
|--------|------|
| Google | ID token / OAuth → JWT in `auth_token` |

`wallet_address` on a member is optional profile data (admin-editable), not a sign-in method.

Session: `GET /api/auth/session` with `Authorization: Bearer <token>`.  
Code: `src/store/useStore.ts`, `src/components/layout/PageShell.tsx`.

## Notes

- Source lives under `src/`
- Academy curated seed: edit **only** `backend/content/academy-v2/seed/` (loaded here as `@academy-v2-seed`). No FE copy, no sync command — content authors just edit JSON and commit.
- Production: set env from `.env.example.deployment`, then `npm run build` → deploy `dist/`
