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
- Local session handling
- Protected dashboard shell with separate owner and student variants
- Reusable dashboard calendar with a right-side schedule list

Current routes:

- `/`
- `/login`
- `/register`
- `/app/dashboard`
- `/app/availability`
- `/app/owners`
- `/app/teams`
- `/app/teams/create`

Right now, the frontend still uses a local session rather than backend authentication. Logging in or registering with a McGill email will open the dashboard shell and choose the role from the email domain.

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
- `../files.md`
  - simple guide outside `frontend/` that explains what the current frontend files do

Components:

- `src/components/AccountPanel.jsx`
  - login and register overlay panels
  - now set a simple local session
- `src/components/BrandLink.jsx`
  - logo and site wordmark in the header
- `src/components/HeroCalendar.jsx`
  - animated calendar visual in the hero
- `src/components/ScheduleCalendar.jsx`
  - reusable month calendar for booking-style views

New folders:

- `src/layouts/`
  - shared page shells such as `DashboardLayout`
- `src/routes/`
  - route guards such as `SignedInRoute` and `WelcomeRoute`
- `src/context/`
  - current local session state
- `src/pages/`
  - routed screens such as `LandingPage`, dashboard, availability, owners, and teams
- `src/components/ownerAvailability/`
  - owner availability form, selector, preview, schedule list, and support helpers
- `src/utils/`
  - small date helpers for the calendar and schedule list

Owner availability structure:

- `src/pages/OwnerAvailabilityPage.jsx`
  - keeps owner availability state, API loading, create, and delete handlers
- `src/components/ownerAvailability/`
  - contains the booking-type selector, office-hour form pieces, preview, schedule list, constants, and helper functions

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
- The dashboard should look like an extension of the landing page
- Owner and student variants should differ through labels and navigation, not through unrelated styling
- The dashboard is now arranged as:
  - calendar on the left
  - schedule list on the right
  - all events shown first, then filtered by selected day

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
- No real persistence beyond frontend local storage
- Dashboard still uses temporary local event examples
- `favicon.ico` is still missing

## Next frontend steps

- Connect login/register to the real backend
- Keep dashboard and owners flows aligned with the backend
- Wire real data into the dashboard after backend endpoints are ready
- Add final responsive cleanup after backend pages exist


If you change structure, routes, or major copy, update this file so the rest of the team stays aligned.
