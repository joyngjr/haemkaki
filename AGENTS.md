# HaemKaki frontend — agent guidance

This is the single source of truth for coding agents working in this repo.
`CLAUDE.md` imports it and Gemini CLI reads it via `.gemini/settings.json`; keep
all agent rules here rather than in tool-specific files.

## Scope

- This repo is the frontend only: React + TypeScript + Vite + Tailwind CSS.
- The backend lives in a separate repo (`haemkaki-backend`, usually checked out
  as a sibling directory). Treat it as read-only reference: read its routers and
  schemas before building API-connected UI so request payloads, response models
  and the TypeScript types in `src/lib/api.ts` stay aligned. Never modify it.
- The backend serves interactive API docs at `/docs` when running locally.
- Prefer simple, hackathon-ready solutions over abstraction.

## Repo layout

- `src/` — the app. Pages in `src/pages/`, shared pieces in
  `src/components/<area>/`, non-React logic in `src/lib/`, context in
  `src/state/`. Only `src/lib/api.ts` reads `import.meta.env`.
- `docs/` — long-form project docs: `architecture.md`, `deploying.md`, and
  `domain/` for haemophilia reference material.
- `.agents/skills/` — agent skills (the domain-expert research skill).
- `README.md` — setup, core features and common issues.

See `docs/architecture.md` for the full `src/` tree and how the tracker persists.

## Mobile-first design (hackathon priority)

This app must be built **mobile-first**. Most demo and judging traffic will be
on phones, and the web app should look and feel like a mobile app, with a later
native conversion in mind.

- **Base styles = mobile.** Write unprefixed Tailwind utilities for the smallest
  viewport (~375px wide), then layer in `sm:` / `md:` / `lg:` / `xl:` prefixes
  only to adapt for larger screens. Never write desktop styles first and
  retrofit mobile with overrides.
- **Touch targets.** Interactive elements (buttons, links, inputs) should be at
  least 44x44px. Add sufficient padding (`p-3`+) rather than relying on default
  sizes.
- **Layout defaults to single column.** Use `flex-col` / `grid-cols-1` as the
  base, switching to multi-column only at `md:` and up.
- **Typography and spacing scale down, not up.** Pick sizes that read well on a
  small screen first (e.g. `text-base`, `p-4`), then increase at larger
  breakpoints if needed.
- **Avoid fixed widths/heights** that break on narrow viewports. Prefer
  `w-full`, `max-w-*` and relative units. A centered `max-w-md` container is a
  fine way to keep the desktop presentation mobile-like.
- **No hover-only interactions.** Anything that matters must also work with tap.
- **Test at mobile widths first.** When verifying a change in the browser,
  check ~375px and ~390px viewports before checking desktop.

## Stack conventions

- Components: React function components with TypeScript.
- Styling: Tailwind utility classes; use the `cn` helper from `src/lib/utils.ts`
  (`clsx` + `tailwind-merge`) for conditional or merged class names rather than
  string concatenation.
- Use the `brand-*` and `sand-*` scales from `tailwind.config.js` rather than
  hard-coded hex colours.

## Verification

Before considering a change complete, run:

```bash
npm run lint
npm run typecheck
```

There is no test runner in this project. Do not run or create tests (no test
files, no Playwright or other browser automation).
