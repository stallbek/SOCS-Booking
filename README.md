# SOCS Booking Frontend

This folder contains the current React frontend for the SOCS Booking project.

## What this frontend currently includes

- Public landing page
- Header brand and navigation
- Hero section with the animated booking calendar
- `How it works` section
- `Features` section
- Footer call-to-action
- Routed login and register overlays

Current routes:

- `/`
- `/login`
- `/register`

Right now, the frontend is mainly focused on presentation and structure. The login and register screens are visual only. They are not connected to backend authentication yet.

## Tech stack

- React 18
- Vite
- React Router
- Plain CSS in `src/styles.css`

## Run locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## File structure

Main files:

- `src/main.jsx`
  - app entry point
  - wraps the app in `BrowserRouter`
- `src/App.jsx`
  - route mapping for `/`, `/login`, and `/register`
- `src/styles.css`
  - all shared page styling

Components:

- `src/components/LandingPage.jsx`
  - main landing page layout
  - hero, sections, footer
  - shows auth overlay when needed
- `src/components/AuthOverlay.jsx`
  - login and register overlay panels
  - currently UI-only
- `src/components/BrandLink.jsx`
  - logo and site wordmark in the header
- `src/components/HeroCalendar.jsx`
  - animated calendar visual in the hero

## Design direction

The visual direction is intentionally academic and restrained rather than startup-like.

What to preserve:

- McGill-inspired red, black, white, and neutral gray palette
- Sharp corners and straight edges
- Clean institutional layout instead of soft app-style cards everywhere
- Serif display type for major headings
- A balanced hero section where the text block and calendar feel close in weight
- Minimal but meaningful motion

What to avoid:

- Rounded pill-heavy UI everywhere
- Generic SaaS copy
- Extra decorative sections that do not support the booking product
- Big framework-like abstractions for simple presentational code
- Fake frontend business logic that is not connected to the real backend

## Current UX decisions

- Login and register are separate routes, but they appear as overlays above the landing page
- Header and footer stay visible behind the auth overlay
- The landing page should explain the booking product, not the implementation details
- Copy should stay direct and readable
- The site should feel like a university tool, not a marketing template

## Before changing copy

The assignment is for a McGill booking application. Keep the language tied to:

- office hours
- appointment booking
- professors and TAs posting availability
- students reserving time slots
- recurring availability
- invitation links
- dashboards and booking visibility


## Known limitations

- No backend integration yet
- No real authentication yet
- No persistence yet
- No owner dashboard or booking flow wired up yet
- `favicon.ico` is still missing

## Next frontend steps

- Connect login/register to the real backend
- Add the authenticated dashboard flow
- Add owner and student booking views
- Wire real data into the calendar and booking lists
- Add final responsive cleanup after backend pages exist


If you change structure, routes, or major copy, update this file so the rest of the team stays aligned.
