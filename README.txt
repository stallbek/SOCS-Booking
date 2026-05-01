SOCS Booking Application

RUNNING WEBSITE URL
================================================================================

URL: https://winter2026-comp307-group30.cs.mcgill.ca/

The application is hosted on the McGill MIMI server and requires McGill VPN to access.


TECH STACK
================================================================================

MERN (MongoDB, Express.js, React, Node.js)

  Frontend:   React 18, Vite, React Router, plain CSS
  Backend:    Node.js, Express.js, Mongoose, express-session
  Database:   MongoDB
  Deployment: Node.js on MIMI (port 3000), serves the built React frontend
              from the same process


TEAM MEMBERS AND CODE WORKED ON
================================================================================

Name: Stalbek Ulanbek uulu
ID:   261102435
Role: Frontend
Code: All frontend pages, components, layouts, routing, and styling.
      Files: App.jsx, main.jsx, styles.css, LandingPage.jsx, DashboardPage.jsx,
      OwnerAvailabilityPage.jsx, StudentOwnersPage.jsx, TeamsPage.jsx,
      CreateTeamsPage.jsx, EditTeamsPage.jsx, BookPage.jsx, DashboardLayout.jsx,
      AccountPanel.jsx, BrandLink.jsx, HeroCalendar.jsx, ScheduleCalendar.jsx,
      SchedulePanel.jsx, PageHeader.jsx, BookingTypeFilter.jsx,
      BookingTypeButton.jsx, NotificationActions.jsx, OutlineButton.jsx,
      UserSearch.jsx, all bookings/shared/*, bookings/type1/*, bookings/type2/*,
      bookings/type3/*, feedback/* components, context/SessionContext.jsx,
      context/FeedbackContext.jsx, routes/SignedInRoute.jsx,
      routes/WelcomeRoute.jsx, api/api.js, utils/date.js, utils/bookings.js,
      deployment scripts, and overall project coordination.

--------------------------------------------------------------------------------

Name: Ananya Krishnakumar
ID:   261024261
Role: Backend
Code: Backend setup, Express/Node server initialization,
      Database connection setup (`config/db.js`) backend dependencies, 
      data models (`User.js`, `Slot.js`, `MeetingRequest.js`, `GroupMeeting.js`, 
      `TeamRequest.js`), route definitions (`authRoutes.js`, `meetingRoutes.js`, 
      `teamRoutes.js`, `slotRoutes.js`), controllers (`authController.js`, 
      `meetingController.js`(meeting requests, voting, notifications), 
      `slotController.js`(slot creation, booking, invite links, public access), 
      `teamController.js`), and frontend pages for the Team Finder feature 
      (`TeamPage.js`, `CreateTeamsPage.js`, `EditTeamsPage.js`) Student Booking
      flow-invite link handing, slot loading, booking logic (`BookPage.js`).

--------------------------------------------------------------------------------

Name: Sterlande Herard
ID:   260987475
Role: Backend / Auth
Code: Session-based authentication implementation, MongoDB connection and server
      configuration (db.js, server.js), auth middleware (authMiddleware.js),
      slot route protection, frontend auth routing, and connecting frontend
      session context to the real backend auth flow.
      changed getPublicOwners() to fix the bug that only allowed users to see owners with active slots

--------------------------------------------------------------------------------

Name: Emerson Lin
ID:   261096196
Role: Backend / Slots
Code: Owner slot management endpoints, office hour creation logic, group meeting flow, user booking
      flow, public slot browsing, invite code and ID-based slot retrieval
      endpoints, and meeting route integration (slotController.js,
      slotRoutes.js, Slot.js, meetingController.js, OwnerGroupMeetingPanel.jsx).


30% NOT CODED BY THE TEAM (AI-GENERATED / EXTERNAL)
================================================================================

The following files or sections were written with AI assistance. All other code
was written by hand by the team members listed above.

1. HeroCalendar component (src/components/HeroCalendar.jsx)
   The animated calendar visual on the landing page was written with AI
   assistance.

2. ScheduleCalendar component (src/components/ScheduleCalendar.jsx)
   The reusable month calendar used in dashboard booking views was written with
   AI assistance.

3. SchedulePanel component (src/components/SchedulePanel.jsx)
   The right-side schedule list panel on the dashboard was written with AI
   assistance.

4. Utility helpers (src/utils/date.js, src/utils/bookings.js)
   Date formatting helpers and booking state logic were written with AI
   assistance.

5. Group meeting helpers (src/components/bookings/type2/groupMeetingUtils.js)
   The shared Type 2 grouped-date validation, payload-building, and
   slot-grouping logic was written with AI assistance.

6. Owner Type 2 panel (src/components/bookings/type2/OwnerGroupMeetingPanel.jsx)
   The owner-side Type 2 date-card composer and meeting management UI was
   written with AI assistance.

7. Owner Availability Page (src/pages/OwnerAvailabilityPage.jsx)
   The overall page structure, state declarations, and API call handlers were
   written by hand. AI assistance was used for the ResizeObserver
   height-synchronization logic (keeping the schedule panel aligned to the
   calendar card across window resizes), the useMemo/useCallback memoization of
   derived event lists, and the inline renderActions/renderBody render props
   inside SchedulePanel.

Total AI-assisted lines: 2,328 out of 11,832 total (~19.7%) - within the 30%
limit.


