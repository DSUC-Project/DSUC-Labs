# Academy v2 curated seed (canonical)

**Edit curated content only here** — there is no second JSON tree under `frontend/`.

```
backend/content/academy-v2/seed/*.json
```

| Consumer | How it loads this folder |
|----------|---------------------------|
| Backend | `src/lib/academyV2Catalog.ts` reads from disk at runtime |
| Frontend | Vite alias `@academy-v2-seed` → this folder (bundled into the SPA at **frontend build** time) |

## Contributor workflow

1. Edit the JSON files above.
2. Commit.

No copy/sync script. Guards run automatically on `npm run build` (you do not need to run them for normal edits).

### Deploys after a seed change

| Surface | Needs |
|---------|--------|
| Progress validation / academy API (backend) | Backend redeploy (or restart) so it rereads seed from disk |
| Learner UI paths/courses/units (curated) | **Frontend rebuild + redeploy** — curated content is embedded in the SPA bundle, not fetched live from the API |

If only the backend is redeployed, the API may accept units that the currently live frontend bundle does not show (or the reverse until FE ships). Prefer shipping both when seed changes.

Community tracks live in Supabase, not in this seed.

## Files

- `learningPath.json` — learning paths → course refs  
- `course.json` — courses → module refs  
- `modules.json` — modules → lesson refs  
- `lessons.json` — unit bodies (markdown, challenges, tests)  
- `instructor.json` — instructors  
