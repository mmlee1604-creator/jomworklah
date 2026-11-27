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

The candidate site loads its TVET course catalogue from the API (Supabase is the source), so start the backend first (`cd backend; npm run dev`, port 8787). The API address is set in `public/js/config.js`. If the API is down, the Upskilling Hub shows an error with a retry button.

## Where things live

- `app/layout.js` is the shared root layout: fonts, Tailwind CDN, `styles.css` and `skills-atlas.css`.
- `app/employer/layout.js` adds `employer.css` plus the employer header and footer.
- `public/js/app.js` is the candidate site: a hash-routed SPA that fills the skeleton from `app/candidate/page.js`. It loads after `mock-data.js`, `skills-atlas-data.js` and `skills-atlas.js`, in that order, via `app/candidate/legacy-scripts.js`.
- `public/styles.css` is the global design system for the candidate site; `public/skills-atlas.css` is scoped to the atlas component under `.skills-atlas`; `public/employer.css` holds the `.emp-*` employer styles.
- `public/assets/` is shared by both sites: brand marks, persona photos, MBTI illustrations, provider logos and the hero artwork.

Edit CSS and the SPA in `public/` directly — there is no second copy to keep in sync.
