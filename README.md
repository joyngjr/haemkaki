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
  index.css                    Tailwind directives, base styles, reduced motion
  pages/
    Home.tsx                   the phone's Home tab: the status card (Kaki's
                               scene, cover left, vials at home, the dose and
                               order buttons) and recent entries
    Dashboard.tsx              the web version from `lg`: the status card, the
                               tracker's cards and Resources on one page
    Tracker.tsx                calendar, factor supply, inventory, routine; a
                               `layout` prop decides where the cards go
    tips/Tips.tsx              the phone's Resources tab
    tips/MedicalId.tsx         emergency card: diagnosis, contacts, call links
    tips/FindMedicalHelp.tsx   Leaflet map of hospitals, pharmacies, polyclinics
    tips/ImportTracker.tsx     the connector address and the steps for importing via an assistant
    tips/injection/            injection guide + one page per route
                               (intravenous, subcutaneous, port-a-cath)
  components/
    layout/                    AppLayout shell (and the desktop top bar),
                               PageHeader, BackLink
    nav/                       BottomNav — the tab bar on a phone; the web
                               version has no tabs
    tracker/                   calendar, day sheets (incl. MoveDoseFlow),
                               supply, inventory, routine and Plan Ahead cards,
                               DatePicker, FrequencyEditor (every N days or
                               fixed weekdays), ScheduleShiftPrompt; useLedger
                               (the entries), useSchedule (the routine and its
                               planned doses), usePlans (temporary changes to
                               it), useStatus (the fold) and useSupplies (the
                               inventory list)
    platelet/                  the platelet mascot: Platelet (flat, for the
                               calendar), StatusScene (Kaki at home, the status
                               card's scene) and Kaki
    profile/                   profile button, sheet, avatar, add-profile form
    tips/find-medical-help/    HealthMap, MapLegend, map marker icons
    tips/injection/            headers, step lists, type cards for the guide
    tips/medical-id/           section cards and call links
    tips/                      tip cards, icons, and ResourceSections (the
                               parts of Resources both layouts use)
    ui/                        Button, Card, Stat, StatusDot, Callout,
                               ChevronRight
  lib/
    api.ts                     the ONLY place that reads VITE_API_URL; wraps
                               fetch and mirrors the backend's schemas —
                               profiles, events, schedules, status, supplies
    nav.ts                     NAV_ITEMS — the phone's three tabs
    use-media-query.ts         useIsDesktop — which of the two layouts to show
    scroll.ts                  scrollToSection and useScrollToHash, for
                               "/tracker#supply" and the one-page sections
    home-data.ts               Home's data contracts and buildHomeData, which
                               derives the screen from a profile + its status
    tracker-entries.ts         the TrackerEntry union, the shared "log a dose"
                               rule, and the adapter to and from the API's rows
    tracker-dates.ts           day keys, the Singapore clock, the Frequency
                               type and its labels and shifts
    tracker-plans.ts           Plan Ahead's type, its API adapter and labels
    home-format.ts             Home's date formatting and the overdue rule
    theme.ts                   ink, surface and status tone tokens
    health-locations.ts        static list of Singapore care locations
    medication-catalog.ts      product names, units and routes for the form
    drug-allergy-catalog.ts    drug names for the allergy picker
    utils.ts                   cn() — clsx + tailwind-merge class joiner
  state/
    ProfileProvider.tsx        loads profiles from the API; remembers the
                               active one in localStorage
    profile-context.ts         the context and its hook
    HomeDataProvider.tsx       Home's state, above the router: the folded
                               status per profile, the "Log dose" and "Move"
                               writes, and writeVersion so the tracker follows
    home-context.ts            the context and its hook
```

Conventions: pages in `src/pages/`, shared pieces in `src/components/<area>/`,
non-React logic in `src/lib/`, context in `src/state/`. Only `src/lib/api.ts`
touches `import.meta.env`. Styling is Tailwind and mobile-first — unprefixed
utilities are the phone layout, `sm:`/`md:` adapt upward. Use the `brand-*` and
`sand-*` scales from `tailwind.config.js` rather than hard-coded hex.

## Core features

| Feature                                                                                                         | State                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profiles — create, switch, edit, delete a household member                                                      | Backed by the API (`/users`)                                                                                                                                                                                                                                                                                 |
| Tracker calendar — month grid, per-day markers, and logging a refill or a factor use against a date             | Backed by the API (`/users/{id}/events`); survives a refresh                                                                                                                                                                                                                                                 |
| Missed doses — a planned day already past with no factor use on it                                              | Derived, never logged: from the routine and the ledger in the page, and from `status.missed_doses` on Home. Logging the dose on that day, or a "missed dose taken late" naming it, takes the mark off                                                                                                        |
| Factor supply — vials left, the low-supply warning, recent activity                                             | Folded from the ledger by the API, not counted in the page                                                                                                                                                                                                                                                   |
| Recommended order — run-out date, order-by date, vials to order, and a "?" showing the working                  | Folded by the API from vials on hand, the planned doses and the vials the profile keeps at home (the order-by date is the day the stock falls below it); the breakdown comes from `/status` too. Advice only: the app places no order — the user buys through their centre and logs the delivery as a refill |
| Current routine — every N days or on fixed weekdays from a start date, vials per dose                           | A recurring series in the API (`/users/{id}/schedules`), seeded from the dose on the profile. Changing it starts a new series; removing it keeps logged doses                                                                                                                                                |
| Plan Ahead — a different frequency and/or dosage over a date range (travel, illness)                            | Backed by the API (`/users/{id}/plans`); the calendar, run-out date and order follow it. Plans cannot overlap                                                                                                                                                                                                |
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
| "Could not reach the API. Is the backend running?" | No backend on `VITE_API_URL`                                   | Start `uvicorn app.main:app --reload` in `hackitrx-backend`, or point `.env.local` at the Railway URL |
| CORS error in the console                          | Origin missing from the backend allow-list                     | Add it to `CORS_ORIGINS` in the backend `.env` and restart                                            |
| Env var reads as `undefined`                       | Not prefixed `VITE_`, or the dev server was not restarted      | Rename to `VITE_*` and restart `npm run dev`                                                          |
| Blank page on refresh at a sub-route               | SPA rewrite missing                                            | `vercel.json` rewrites all routes to `index.html`                                                     |
| Leaflet map renders grey                           | Container has no height, or the CSS was not imported           | Give the container an explicit height; import `leaflet/dist/leaflet.css`                              |
| Tracker entries vanish on refresh                  | The backend is unreachable, so `useLedger` has nothing to load | Check the API is up; the tracker shows the reason above the calendar                                  |
| Home shows "Welcome" and no scene                  | There is no profile yet, or the profile list failed to load    | Add one from the profile button; the message names the API error if there was one                     |
| A tracker popup sits behind the tab bar            | `AppLayout`'s tab bar is `z-40`                                | `Sheet`'s `tier` prop sets the stacking order; use it rather than a raw `z-*` class                   |

## How the tracker persists

Entries live in `/users/{id}/events`, one row per logged action.
`useLedger` (`src/components/tracker/useLedger.ts`) owns the round trip: every
mutation is a pure `EntryMap -> EntryMap`, applied once to local state so the
calendar moves immediately and once inside a serialised queue against whatever
the server actually holds. Diffing those two maps produces the writes, and each
write is followed by a re-read — one small GET per action, in exchange for never
inventing an id locally. A failed write rolls the screen back to server state
and shows the reason above the calendar.

Home's "Taken" button goes through the same diff (`applyDiff` is exported for
it) with the same rule (`recordProphylaxis` in `src/lib/tracker-entries.ts`),
so a dose recorded on Home is exactly the entry the tracker would have made.

The routine is separate. `useSchedule` asks the API for the series and for the
planned doses inside the calendar's visible grid, and sends the three writes —
replace the series, remove it, move or restore one dose — then re-reads. It
computes no dates itself: the recurrence and the moves live in the API. After
any write the `version` moves, and `useStatus` re-reads the fold — vials on
hand, the run-out date and the order advice — so the supply card follows both
the ledger and the schedule without the page running a copy of the arithmetic.

Plans are the same shape again. `usePlans` lists `/users/{id}/plans` and sends
the three writes — add, replace, remove — then re-reads; its `version` is
passed to `useSchedule` as a reload key and added into `useStatus`'s, because
the planned doses and the fold both change when a plan does. The page never
works out which days a plan puts a dose on; the API's occurrences already have
`plan_id` set on them, and a dose with a `plan_id` is not offered for moving.

The "shift all future doses?" prompt is page state only: it appears right after
a prophylaxis (or completed made-up) dose lands on a day with no planned dose,
no plan and no later routine dose, and "yes" is an ordinary `replace` of the
series starting from that day. Nothing about the answer is stored.

Three rules for anyone touching this:

- **Mutators must stay pure.** `useLedger` re-applies your updater to the
  authoritative state, so reading `entries` from the closure instead of the
  `current` argument will re-create whatever the previous tap just made.
- **Nothing is counted in the page.** Every entry carries `appliedVials`, what
  the API charged for it; the supply figure and the order advice come from
  `/status`. If a number on screen disagrees with the calendar, the fold is
  wrong, not the page.
- **Days, never minutes.** Every entry is keyed by a Singapore-local
  `YYYY-MM-DD`. Home turns those into midnight-in-Singapore instants and its
  formatting hides the time; keep it that way.

The Inventory card is simpler: `useSupplies` sends the whole list to
`PUT /users/{id}/supplies` on every change, one write at a time, and reloads the
server's list if a write fails.

What still has no backend: a bleed as its own record — Home's "recent bleed"
state is the most recent on-demand dose, which is what the tracker already
draws the blood drop for.

## Deploying

Vercel builds `main` and gives every pull request its own preview URL.
`vercel.json` disables deployments for other branches and rewrites all routes to
`index.html`, so the app survives a refresh on any path. The backend deploys
separately to Railway.
