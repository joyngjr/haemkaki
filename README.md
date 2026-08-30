# HackitRx — web app

React + TypeScript + Vite + Tailwind. A single static welcome page — there is
no authentication and no backend call in this frontend.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

`npm run build` type-checks and builds. `npm run lint` type-checks only.

## How it is put together

```
src/
  App.tsx          renders <Welcome /> — that is the whole app
  main.tsx         React root
  index.css        Tailwind directives + base styles
  pages/Welcome.tsx  the landing page: hero, feature cards, how-it-works
  components/ui/   button, card — the shared primitives
  lib/utils.ts     cn() — clsx + tailwind-merge class joiner
```

Styling is Tailwind utility classes throughout. The `brand` colour scale lives
in `tailwind.config.js`; use `brand-*` rather than hard-coding hex values.

## Deploying

Vercel builds this on every push to `main` and gives every pull request its own
preview URL.

`vercel.json` rewrites all routes to `index.html`, so the page survives a
refresh on any path.
