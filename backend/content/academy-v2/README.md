# Academy v2 curated seed (canonical)

**Edit content only here.** That is the whole workflow.

```
backend/content/academy-v2/seed/*.json
```

| Consumer | How it loads this folder |
|----------|---------------------------|
| Backend | `src/lib/academyV2Catalog.ts` (disk at runtime) |
| Frontend | Vite alias `@academy-v2-seed` → this folder |

There is **no** second copy under `frontend/`.  
There is **no** sync or “check” step for content authors — change JSON, commit, done.

Guards run automatically on `npm run build` (do not require them for normal edits).

## Files

- `learningPath.json` — learning paths → course refs  
- `course.json` — courses → module refs  
- `modules.json` — modules → lesson refs  
- `lessons.json` — unit bodies (markdown, challenges, tests)  
- `instructor.json` — instructors  

Community tracks live in Supabase, not in this seed.
