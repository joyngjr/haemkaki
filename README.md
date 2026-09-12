# HackitRx — web app

React + TypeScript + Vite + Tailwind. A mobile-first companion app for people
with haemophilia: a home "den" showing how covered you are, a calendar tracker
for doses and supply, and a tips section with an injection guide, a medical ID
card, a map of nearby help, and a community feed.

There is no authentication. A "profile" is just a name someone picks on the
device, and anyone holding the phone can switch between everyone in a household.

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
cd ../hackitrx-backend && uvicorn app.main:app --reload
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

## File organisation

```
src/
  App.tsx                      the route table — every page is registered here
  main.tsx                     React root
  index.css                    Tailwind directives, base styles, and the
                               tracker's `[data-theme="warm"]` overrides
  pages/
    Home.tsx                   the den: active profile + factor/stock scene
    Tracker.tsx                calendar, factor supply, and routine editor
    tips/Tips.tsx              the tips index
    tips/MedicalId.tsx         emergency card: diagnosis, contacts, call links
    tips/FindMedicalHelp.tsx   Leaflet map of hospitals, pharmacies, polyclinics
    tips/Community.tsx         groups, posts and comments (localStorage only)
    tips/injection/            injection guide + one page per route
                               (intravenous, subcutaneous, port-a-cath)
  components/
    layout/                    AppLayout shell, PageHeader, BackLink
    nav/                       BottomNav tab bar and its icons
    platelet/                  the platelet mascot: Platelet, PlateletStates,
                               FactorScene (dose state + stock shelf)
    profile/                   profile button, sheet, avatar, add-profile form
    community/                 group list, composers, post card, chips
    find-medical-help/         HealthMap, MapLegend, map marker icons
    injection/                 headers, step lists, type cards for the guide
    medical-id/                section cards and call links
    tips/                      tip cards and icons
    ui/                        Callout, ChevronRight — shared primitives
  lib/
    api.ts                     the ONLY place that reads VITE_API_URL; wraps
                               fetch and mirrors the backend's schemas
    nav.ts                     NAV_ITEMS — the bottom-tab definition
    community-store.ts         community groups/posts/comments in localStorage
    health-locations.ts        static list of Singapore care locations
    utils.ts                   cn() — clsx + tailwind-merge class joiner
  state/
    ProfileProvider.tsx        loads profiles from the API, remembers the
                               active one in localStorage
    profile-context.ts         the context and its hook
  assets/platelet/             the mascot SVGs per dose state
```

Conventions: pages in `src/pages/`, shared pieces in `src/components/<area>/`,
non-React logic in `src/lib/`, context in `src/state/`. Only `src/lib/api.ts`
touches `import.meta.env`. Styling is Tailwind and mobile-first — unprefixed
utilities are the phone layout, `sm:`/`md:` adapt upward. Use the `brand-*` and
`sand-*` scales from `tailwind.config.js` rather than hard-coded hex.

## Core features

| Feature                                                                                                         | State                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Profiles — create, switch, edit, delete a household member                                                      | Backed by the API (`/users`)                                                                                                          |
| Home den — dose state and stock state drawn as the platelet and its shelf                                       | Backed by the API (fields on the profile)                                                                                             |
| Tracker calendar — month grid with per-day markers for factor use, planned prophylaxis, missed doses and bleeds | In-memory only; a refresh clears it                                                                                                   |
| Logging a factor refill, a factor use (prophylaxis, on-demand, follow-up) or a missed dose against a date       | In-memory only                                                                                                                        |
| Missed-dose follow-up — record whether it was taken or skipped, and link the day it was actually taken          | In-memory only                                                                                                                        |
| Factor supply — vials remaining, a low-supply warning, and a recent-activity list                               | Derived in the page from unsaved entries                                                                                              |
| Recommended order — next order date and vials to order                                                          | Partly placeholder: the date is a fixed "7 days before the 1st"; the vial count stays blank until a minimum-supply figure is supplied |
| Current routine — prophylaxis frequency, dosage and effective start date                                        | Editable in the page, but nothing supplies or persists the values                                                                     |
| Tips — injection guide, medical ID, find medical help map                                                       | Static content                                                                                                                        |
| Community — groups, posts, comments, likes                                                                      | localStorage only; nothing is shared between devices                                                                                  |

## Common issues

| Symptom                                               | Cause                                                                                          | Fix                                                                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| "Could not reach the API. Is the backend running?"    | No backend on `VITE_API_URL`                                                                   | Start `uvicorn app.main:app --reload` in `hackitrx-backend`, or point `.env.local` at the Railway URL                                      |
| CORS error in the console                             | Origin missing from the backend allow-list                                                     | Add it to `CORS_ORIGINS` in the backend `.env` and restart                                                                                 |
| Env var reads as `undefined`                          | Not prefixed `VITE_`, or the dev server was not restarted                                      | Rename to `VITE_*` and restart `npm run dev`                                                                                               |
| Blank page on refresh at a sub-route                  | SPA rewrite missing                                                                            | `vercel.json` rewrites all routes to `index.html`                                                                                          |
| Leaflet map renders grey                              | Container has no height, or the CSS was not imported                                           | Give the container an explicit height; import `leaflet/dist/leaflet.css`                                                                   |
| Tracker entries vanish on refresh                     | The tracker holds everything in React state — there is no persistence yet                      | Expected today; it needs the backend endpoints below                                                                                       |
| A tracker popup sits behind the tab bar               | `AppLayout`'s tab bar is `z-40`                                                                | The `[data-theme="warm"]` rules at the end of `src/index.css` lift the tracker's three overlay tiers above it — add new overlays there too |
| The tracker's colours look wrong after a class change | The warm theme overrides utilities by exact class name (`.bg-white`, `.bg-[#6c5ce7]`, `.z-40`) | Update the matching rule in `src/index.css` when you change those classes                                                                  |

## What the tracker still needs from the backend

Nothing on the tracker is persisted. It needs an event ledger keyed by profile:

- `POST/GET/PATCH/DELETE /users/{id}/events` — one row per logged action, with
  a type (`refill`, `prophylaxis_use`, `on_demand_use`, `follow_up_use`,
  `missed_dose`), a date, a vial count, and for a missed dose a link to the day
  it was actually taken.
- Prophylaxis routine fields on the profile — dose in vials, interval in days,
  effective start date, and a minimum-supply buffer. The tracker already accepts
  these as props and calls back on every edit.
- A derived supply figure folded from the ledger, so vials remaining and the
  reorder recommendation do not depend on a device's local state.

## Deploying

Vercel builds `main` and gives every pull request its own preview URL.
`vercel.json` disables deployments for other branches and rewrites all routes to
`index.html`, so the app survives a refresh on any path. The backend deploys
separately to Railway.
