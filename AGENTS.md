# HaemKaki Frontend Guidance

This file contains project guidance for coding agents working in
`hackitrx-frontend/`.

## Scope and priorities

- Focus implementation work on the frontend in this directory.
- Treat `../hackitrx-backend/` as read-only reference code. Do not modify it.
- Read the backend routers and schemas before building API-connected UI so that
  request payloads, response models, and frontend TypeScript types stay aligned.
- Prefer simple, hackathon-ready solutions with appropriate test coverage over
  unnecessary abstraction.
- Add tests for new components, utility functions, and API integrations when
  changing or adding those areas.

The backend's interactive API documentation is available at `/docs` when it is
running locally.

## Technology and conventions

- Stack: React, TypeScript, Vite, and Tailwind CSS.
- Use TypeScript React function components.
- Style with Tailwind utilities.
- For conditional or merged classes, use `clsx`, `tailwind-merge`, or the
  existing `cn` helper rather than manually concatenating class strings.

## Mobile-first UI requirements

HaemKaki is a web app intended to feel like a mobile application, with a later
native-app conversion in mind.

- Design the unprefixed Tailwind styles for small screens (about 375px wide).
- Keep the desktop presentation mobile-like when useful, for example with a
  centered `max-w-md` container.
- Make tap targets at least 44 by 44 pixels; use adequate padding rather than
  relying on browser defaults.
- Use single-column layouts as the baseline (`flex-col` or `grid-cols-1`).
- Choose typography and spacing that remain comfortable on a small screen.
- Never make functionality depend only on hover; all interactions must work by
  tap or click.
- When checking UI in a browser, verify approximately 375px and 390px mobile
  viewports.

## Verification

Before completing a frontend change, run the relevant tests plus:

```bash
npm run lint
npm run typecheck
```
