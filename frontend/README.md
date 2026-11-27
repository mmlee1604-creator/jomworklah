# JomWorkLah frontend

Next.js app holding both client-facing sites of the prototype:

| Route | Site | Source |
| --- | --- | --- |
| `/` | Redirects to `/candidate` | `app/page.js` |
| `/candidate` | Job-seeker app: profile, careers, training, roadmap, Skills Atlas | `app/candidate/page.js` |
| `/employer` | Employer talent search | `app/employer/page.js` |
| `/employer/candidates/[id]` | Candidate profile for the employer | `app/employer/candidates/[id]/page.js` |

## Run

```powershell
npm install
npm run dev
```

Then open <http://localhost:3000/candidate> and <http://localhost:3000/employer>. Use `localhost`, not `127.0.0.1`, unless `allowedDevOrigins` in `next.config.mjs` covers the host you use.

The candidate site loads its TVET course catalogue and user data from the API, so start the backend first (`cd backend; npm run dev`, port 8787). For local development the API defaults to `http://localhost:8787/api`. For a Vercel build, set `NEXT_PUBLIC_API_BASE` to the deployed API base URL, including `/api` (for example, `https://your-api.onrender.com/api`). The backend must allow the frontend's origin in `FRONTEND_ORIGIN`. If the API is down, the Upskilling Hub shows an error with a retry button.

## Deploy to Vercel

Create a Vercel project with the repository's `frontend/` directory as its root. Set
`NEXT_PUBLIC_API_BASE` to the Render API URL ending in `/api` before building. This is a public API
address, not a secret; do not put Supabase credentials in the frontend environment.

## Where things live

- `app/layout.js` is the shared root layout: fonts, Tailwind CDN, `styles.css` and `skills-atlas.css`.
- `app/employer/layout.js` adds `employer.css` plus the employer header and footer.
- `public/js/app.js` is the candidate site: a hash-routed SPA that fills the skeleton from `app/candidate/page.js`. It loads after `mock-data.js`, `skills-atlas-data.js` and `skills-atlas.js`, in that order, via `app/candidate/legacy-scripts.js`.
- `public/styles.css` is the global design system for the candidate site; `public/skills-atlas.css` is scoped to the atlas component under `.skills-atlas`; `public/employer.css` holds the `.emp-*` employer styles.
- `public/assets/` is shared by both sites: brand marks, persona photos, MBTI illustrations, provider logos and the hero artwork.

Edit CSS and the SPA in `public/` directly — there is no second copy to keep in sync.
