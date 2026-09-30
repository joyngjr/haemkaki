# HaemKaki — web app

React + TypeScript + Vite + Tailwind. A mobile-first companion app for people
with haemophilia: a home screen showing how covered you are and letting you log
today's dose, a calendar tracker for doses, the routine and supply, and a
resources section with an injection guide, a medical ID card and a map of
nearby help.

On a phone those are three tabs. From `lg` (1024px) the web version puts
everything on one page instead — no tabs or sidebar, just a top bar with the
account switcher in the top right corner.

There is no authentication. A "profile" is just a name someone picks on the
device, and anyone holding the phone can switch between everyone in a household.
The one chosen last is remembered on the device.

## First-time setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173.

`.env.local` needs one variable:

```
VITE_API_URL=http://localhost:8000
```

Point it at the deployed Railway backend instead to run the frontend alone.
The backend is a sibling repo:

```bash
cd ../haemkaki-backend && uvicorn app.main:app --reload
```

Or bring up frontend, backend and Postgres together from the parent directory:

```bash
docker compose up
```

That serves the frontend on 5173 and the backend on 8000.

Scripts: `npm run dev` (Vite dev server), `npm run build` (`tsc -b` then build),
`npm run typecheck` (types only), `npm run lint` / `npm run lint:fix` (ESLint),
`npm run format` (Prettier). `lint-staged` runs ESLint and Prettier on commit
via Husky.

## Core features

| Feature                                                                                                         | State                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profiles — create, switch, edit, delete a household member                                                      | Backed by the API (`/users`)                                                                                                                                                                                                                                                                                 |
| Tracker calendar — month grid, per-day markers, and logging a refill or a factor use against a date             | Backed by the API (`/users/{id}/events`); survives a refresh                                                                                                                                                                                                                                                 |
| Missed doses — a planned day already past with no factor use on it                                              | Derived, never logged: from the routine and the ledger in the page, and from `status.missed_doses` on Home. Logging the dose on that day, or a "missed dose taken late" naming it, takes the mark off                                                                                                        |
| Factor supply — vials left, the low-supply warning, recent activity                                             | Folded from the ledger by the API, not counted in the page                                                                                                                                                                                                                                                   |
| Recommended order — run-out date, order-by date, vials to order, and a "?" showing the working                  | Folded by the API from vials on hand, the planned doses and the vials the profile keeps at home (the order-by date is the day the stock falls below it); the breakdown comes from `/status` too. Advice only: the app places no order — the user buys through their centre and logs the delivery as a refill |
| Current routine — every N days or on fixed weekdays from a start date, vials per dose                           | A recurring series in the API (`/users/{id}/schedules`), seeded from the dose on the profile. Changing it starts a new series; removing it keeps logged doses                                                                                                                                                |
| Plan Ahead — hand-picked dose days and/or a different dosage over a date range (travel, illness)                | Backed by the API (`/users/{id}/plans`); the calendar, run-out date and order follow it. Plans cannot overlap                                                                                                                                                                                                |
| Off-cycle dose prompt — "shift all future doses?" after a routine dose is logged on an unplanned day            | Yes restarts the series from that day (rotating a weekly routine's days); no leaves the cycle alone                                                                                                                                                                                                          |
| Move one planned dose                                                                                           | From the day's sheet on the calendar, or "Move" on the status card; a calendar exception on the series, shown as a dashed ring. A plan's dose follows the plan and is not movable                                                                                                                            |
| Inventory — gauze, syringes, saline and whatever else                                                           | Backed by the API (`/users/{id}/supplies`); survives a refresh                                                                                                                                                                                                                                               |
| Status card — Kaki's scene, cover left, vials at home, and running low / out of factor with "How much to order" | Real, from `/users/{id}/status`: dose state, last/next dose, recent bleed, vials and the order advice. Demo: the half-life behind the meter. No separate supply banner: the card's status word, room and vials figure carry it                                                                               |
| Status card — "Log dose" / "I took it"                                                                          | Writes a prophylaxis event to the ledger on the chosen day; the tracker shows it too                                                                                                                                                                                                                         |
| Status card — "Move"                                                                                            | Moves the next planned dose as a calendar exception; the tracker shows the same move                                                                                                                                                                                                                         |
| Web version — everything on one page from `lg`, account switcher in the top right                               | `Dashboard.tsx`. `/tracker` and `/tips` redirect to their section of the page; the Resources subpages stay pages of their own                                                                                                                                                                                |
| Medical ID                                                                                                      | Real: name, diagnosis, severity, DOB, medication, drug allergies, blood type, emergency contact, primary doctor — all from the profile                                                                                                                                                                       |
| Tips — injection guide, find medical help map                                                                   | Static content                                                                                                                                                                                                                                                                                               |

## Common issues

| Symptom                                            | Cause                                                          | Fix                                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "Could not reach the API. Is the backend running?" | No backend on `VITE_API_URL`                                   | Start `uvicorn app.main:app --reload` in `haemkaki-backend`, or point `.env.local` at the Railway URL |
| CORS error in the console                          | Origin missing from the backend allow-list                     | Add it to `CORS_ORIGINS` in the backend `.env` and restart                                            |
| Env var reads as `undefined`                       | Not prefixed `VITE_`, or the dev server was not restarted      | Rename to `VITE_*` and restart `npm run dev`                                                          |
| Blank page on refresh at a sub-route               | SPA rewrite missing                                            | `vercel.json` rewrites all routes to `index.html`                                                     |
| Leaflet map renders grey                           | Container has no height, or the CSS was not imported           | Give the container an explicit height; import `leaflet/dist/leaflet.css`                              |
| Tracker entries vanish on refresh                  | The backend is unreachable, so `useLedger` has nothing to load | Check the API is up; the tracker shows the reason above the calendar                                  |
| Home shows "Welcome" and no scene                  | There is no profile yet, or the profile list failed to load    | Add one from the profile button; the message names the API error if there was one                     |
| A tracker popup sits behind the tab bar            | `AppLayout`'s tab bar is `z-40`                                | `Sheet`'s `tier` prop sets the stacking order; use it rather than a raw `z-*` class                   |

## More docs

- [`docs/architecture.md`](docs/architecture.md) — the `src/` tree, conventions,
  and how the tracker persists its data.
- [`docs/deploying.md`](docs/deploying.md) — Vercel and the backend on Railway.
- [`docs/domain/`](docs/domain/) — haemophilia reference material (WFH
  guidelines, medication list, drug allergies, clinical domain guide).
- [`AGENTS.md`](AGENTS.md) — rules for coding agents (mobile-first, conventions,
  verification).
