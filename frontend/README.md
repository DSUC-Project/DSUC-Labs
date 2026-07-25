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
# optional
npm run dev:mock   # local API + local-auth UI
npm run build
npm run preview
```

## Env

| Variable | Notes |
|----------|--------|
| `VITE_API_BASE_URL` | Backend origin |
| `VITE_FRONTEND_URL` | This app origin |
| `VITE_GOOGLE_CLIENT_ID` | Google login button |
| `VITE_ENABLE_LOCAL_AUTH` | Optional local-auth UI |

Templates: `.env.example.local`, `.env.example.deployment`. Restart Vite after env changes.

## Auth (client)

Production login is **Google only**. Do not send bare `x-wallet-address` as auth.

| Method | Flow |
|--------|------|
| Google | ID token / OAuth → JWT in `auth_token` |
| Local mock | `POST /api/auth/dev-login` (mock backend, local only) |

`wallet_address` on a member is optional profile data (admin-editable), not a sign-in method.

Session: `GET /api/auth/session` with `Authorization: Bearer <token>`.  
Code: `src/store/useStore.ts`, `src/components/layout/PageShell.tsx`.

## Notes

- Source lives under `src/`
- Academy curated seed: `src/content/academy-v2/seed/` (keep in sync with `backend/content/academy-v2/seed/`)
- Production: set env from `.env.example.deployment`, then `npm run build` → deploy `dist/`
