# Architecture

How the frontend is laid out and how the tracker keeps its data. For setup,
features and troubleshooting see the [README](../README.md).

## Repo layout

```
AGENTS.md              agent guidance — the one file with rules for coding agents
CLAUDE.md              imports AGENTS.md for Claude Code
.gemini/settings.json  points Gemini CLI at AGENTS.md
.agents/skills/        agent skills (haemkaki-domain-expert)
docs/                  this file, deploying.md, and domain/ (haemophilia references)
src/                   the app — see below
```

Tooling config (Vite, TypeScript, Tailwind, PostCSS, ESLint, Prettier, Husky,
Docker, Vercel) stays at the root, where each tool looks for it.

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
