# Frontend File Guide

This file explains the main files in `frontend/` so the next session can quickly understand where things live.

## Root files

- `package.json`
  - frontend dependencies and scripts
- `vite.config.js`
  - Vite configuration
- `index.html`
  - HTML entry page used by Vite
- `README.md`
  - current frontend overview and project notes
- `files.md`
  - this file, a simple map of the frontend code

## Main app files

- `src/main.jsx`
  - app entry point
  - wraps the app with `BrowserRouter`
  - wraps the app with `SessionProvider`
- `src/App.jsx`
  - main route setup
  - public routes:
    - `/`
    - `/login`
    - `/register`
  - authenticated route:
    - `/app/dashboard`
- `src/styles.css`
  - all shared styling for landing page, account panel, dashboard layout, calendar, and schedule list

## Context

- `src/context/SessionContext.jsx`
  - local session state
  - stores the signed-in user in local storage
  - infers role from email domain
  - `@mcgill.ca` -> owner
  - `@mail.mcgill.ca` -> student

## Components

- `src/components/BrandLink.jsx`
  - shared product brand and logo link
- `src/components/LandingPage.jsx`
  - public home page
  - header, hero, feature sections, footer
  - opens the account panel on `/login` and `/register`
- `src/components/AccountPanel.jsx`
  - login and register overlay
  - validates the simple local form
  - creates the local session and redirects to the dashboard
- `src/components/DashboardLayout.jsx`
  - authenticated page header
  - role-based nav labels
  - current user name and logout button
- `src/components/SignedInRoute.jsx`
  - blocks access to `/app/*` when no user is signed in
- `src/components/WelcomeRoute.jsx`
  - renders the landing page for public routes
  - redirects signed-in users away from auth routes
- `src/components/HeroCalendar.jsx`
  - animated calendar visual used on the landing page hero

## Dashboard components

- `src/components/app/ScheduleCalendar.jsx`
  - reusable month-view calendar
  - shows event counts by day
  - lets the dashboard filter the right-side schedule by selected day
- `src/pages/DashboardPage.jsx`
  - current owner/student dashboard page
  - chooses wording based on role
  - contains temporary local event examples for now
  - shows:
    - user name
    - left calendar
    - right event list
    - `Show all` when a specific day is selected

## Utilities

- `src/utils/date.js`
  - date helpers used by the dashboard
  - day keys
  - month labels
  - long date labels
  - time ranges
  - grouping events by day

## Assets

- `src/assets/mcgill-university-1.svg`
  - main McGill visual used in the brand
- `src/assets/mcgill_icon.png`
  - extra McGill asset kept in the project

## Current limitations

- Authentication is still local only
- Dashboard events are still temporary local examples
- Owner and student nav labels beyond `Dashboard` are not wired yet
- The backend in `frontend/backend` is still separate from this frontend flow
