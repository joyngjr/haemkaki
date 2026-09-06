# hackitrx-frontend

React + TypeScript + Vite + Tailwind CSS.

## Mobile-first design (hackathon priority)

This app must be built **mobile-first**. Most demo/judging traffic will be on phones, so mobile is the primary target, not an afterthought.

- **Base styles = mobile.** Write unprefixed Tailwind utilities for the smallest viewport (~375px wide), then layer in `sm:` / `md:` / `lg:` / `xl:` prefixes only to adapt for larger screens. Never write desktop styles first and retrofit mobile with overrides.
- **Touch targets.** Interactive elements (buttons, links, inputs) should be at least 44x44px. Add sufficient padding (`p-3`+) rather than relying on default sizes.
- **Layout defaults to single column.** Use `flex-col` / `grid-cols-1` as the base, switching to multi-column only at `md:` and up (e.g. `md:flex-row`, `md:grid-cols-2`).
- **Typography and spacing scale down, not up.** Pick sizes that read well on a small screen first (e.g. `text-base`, `p-4`), then increase at larger breakpoints if needed (`md:text-lg`, `md:p-8`).
- **Avoid fixed widths/heights** that break on narrow viewports. Prefer `w-full`, `max-w-*`, and relative units.
- **No hover-only interactions.** Anything that matters must also work with tap — don't gate functionality behind `:hover`.
- **Test at mobile widths first.** When verifying a change in the browser, check ~375px and ~390px viewports before checking desktop.

## Stack conventions

- Components: React function components with TypeScript.
- Styling: Tailwind utility classes; use `clsx`/`tailwind-merge` (`cn` helper if present) for conditional/merged class names rather than string concatenation.
- Run `npm run lint` and `npm run typecheck` before considering a change complete.
- Do not run or create tests (no test runner, no Playwright/browser automation, no new test files) for this project.
