# HackitRx Agent Guidelines

Welcome to the HackitRx project! As an agent assisting on this project, your primary focus is on the **frontend** (`hackitrx-frontend`). The user is a frontend developer and will not be modifying backend code.

However, you must read and understand the backend code (`hackitrx-backend`) to integrate the frontend seamlessly with the backend APIs.

## General Project Rules

- **Write Tests**: Since this hackathon spans an entire month, maintaining stability is important. Write test cases for new components, utility functions, and API integrations as they are developed.
- **Keep it Simple**: Prioritize speed and hackathon-ready code without over-engineering, while maintaining good test coverage.
- **Paths**:
  - Frontend: `hackitrx-frontend/` (Your primary focus)
  - Backend: `hackitrx-backend/` (Read-only reference)

## Backend Integration (Read-Only)

- **Do not modify backend code.**
- **Understand the API:** When building frontend features, always check the backend routers (e.g., `hackitrx-backend/app/routers/`) and schemas (`hackitrx-backend/app/schemas.py`) to understand the expected request payloads and response models.
- **Types:** Ensure the frontend's TypeScript interfaces and types align perfectly with the backend's Pydantic schemas and SQLModel definitions.
- **Interactive Docs:** The backend provides interactive Swagger docs at `/docs` when run locally via `uvicorn app.main:app --reload`.

## Frontend (`hackitrx-frontend`)

**Stack:** React + TypeScript + Vite + Tailwind CSS.

### Mobile App Mimicry (Priority)

The final product must be built as a **web app that mimics a mobile application UI**. We are building a webpage first to meet hackathon deadlines, with the intent to convert it into a native mobile app after the hackathon.

- **Mobile Viewport Target**: Design the web app to look, feel, and function like a mobile app. Write unprefixed Tailwind utilities for small viewports (~375px wide) as the standard view. You can constrain the max width (e.g., `max-w-md mx-auto`) so the app looks like a mobile screen even when viewed on a desktop browser.
- **Touch Targets**: Interactive elements must be at least 44x44px. Use sufficient padding (e.g., `p-3` or greater) rather than relying on default sizes.
- **Single Column Layouts**: Default to `flex-col` / `grid-cols-1` as the base, which is characteristic of mobile apps.
- **Typography/Spacing**: Pick sizes that read well on small screens.
- **No Hover-Only Interactions**: Functionality must work with tap/click, mimicking touch screens. Don't gate features behind `:hover` since real mobile devices do not have hover states.
- **Testing UI**: When verifying in the browser, check using the browser's mobile emulator (e.g., ~375px and ~390px viewports).

### Frontend Conventions

- **Components**: React function components with TypeScript.
- **Styling**: Tailwind utility classes. Use `clsx`/`tailwind-merge` (or a `cn` helper if present) for conditional/merged class names rather than string concatenation.
- **Verification**: Run `npm run lint` and `npm run typecheck` alongside any test suites before considering a change complete.
