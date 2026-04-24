import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import BookingTypeFilter from "../components/BookingTypeFilter";
import PageHeader from "../components/PageHeader";
import ScheduleCalendar from "../components/ScheduleCalendar";
import SchedulePanel from "../components/SchedulePanel";
import { useFeedback } from "../context/FeedbackContext";
import { useSession } from "../context/SessionContext";
import {
  formatLongDate,
  getDayKey,
  groupItemsByDay,
  parseDayKey,
} from "../utils/date";
import {
  allBookingTypeIds,
  createMailtoAction,
  isOfficeHoursSlot,
  mapOwnerAppointmentEvent,
  mapOwnerCalendarEvent,
  mapStudentAppointmentEvent,
} from "../utils/bookings";

function DashboardPage() {
  const { currentUser } = useSession();
  const { confirm, notify } = useFeedback();
  const isOwner = currentUser?.role === "owner";
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [selectedBookingTypeIds, setSelectedBookingTypeIds] =
    useState(allBookingTypeIds);
  const [events, setEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [cancellingEventId, setCancellingEventId] = useState("");
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [scheduleContentMaxHeight, setScheduleContentMaxHeight] = useState(0);
  const [hasOverflowingSchedule, setHasOverflowingSchedule] = useState(false);
  const primaryColumnRef = useRef(null);
  const scheduleCardRef = useRef(null);
  const scheduleContentRef = useRef(null);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);

    try {
      if (isOwner) {
        const data = await apiRequest("/slots/mine/details");
        const bookedSlots = data.filter(
          (slot) => slot.isBooked || slot.bookedBy || slot.bookedByName,
        );
        const ownerCalendarSlots = data.filter(
          (slot) =>
            slot.isBooked ||
            slot.bookedBy ||
            slot.bookedByName ||
            isOfficeHoursSlot(slot),
        );

        setEvents(bookedSlots.map(mapOwnerAppointmentEvent));
        setCalendarEvents(ownerCalendarSlots.map(mapOwnerCalendarEvent));
      } else {
        const data = await apiRequest("/slots/bookings/mine");
        const studentEvents = data.map(mapStudentAppointmentEvent);

        setEvents(studentEvents);
        setCalendarEvents(studentEvents);
      }
    } catch (error) {
      setEvents([]);
      setCalendarEvents([]);
      notify({ message: error.message, tone: "error" });
    } finally {
      setLoadingEvents(false);
    }
  }, [isOwner, notify]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    setShowAllSchedule(false);
  }, [selectedDayKey, selectedBookingTypeIds]);

  const selectedBookingTypes = useMemo(
    () => new Set(selectedBookingTypeIds),
    [selectedBookingTypeIds],
  );
  const todayDayKey = getDayKey(new Date());
  const upcomingEvents = useMemo(
    () => events.filter((event) => getDayKey(event.startAt) >= todayDayKey),
    [events, todayDayKey],
  );

  const countsByType = useMemo(
    () =>
      calendarEvents.reduce(
        (counts, event) => ({
          ...counts,
          [event.bookingType]: (counts[event.bookingType] || 0) + 1,
        }),
        {},
      ),
    [calendarEvents],
  );

  const typeFilteredEvents = useMemo(
    () => events.filter((event) => selectedBookingTypes.has(event.bookingType)),
    [events, selectedBookingTypes],
  );

  const typeFilteredCalendarEvents = useMemo(
    () =>
      calendarEvents.filter((event) =>
        selectedBookingTypes.has(event.bookingType),
      ),
    [calendarEvents, selectedBookingTypes],
  );

  const visibleEvents = selectedDayKey
    ? typeFilteredEvents.filter(
        (event) => getDayKey(event.startAt) === selectedDayKey,
      )
    : upcomingEvents.filter((event) =>
        selectedBookingTypes.has(event.bookingType),
      );

  const groupedEvents = groupItemsByDay(visibleEvents);
  const hasTypeFilters = selectedBookingTypeIds.length > 0;

  const eventsHeading = selectedDayKey
    ? `Events on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : isOwner
      ? "Booked appointments"
      : "Reserved appointments";
  const emptyTitle = !hasTypeFilters
    ? "No booking types selected"
    : selectedDayKey
      ? isOwner
        ? "No booked appointments on this day"
        : "No bookings on this day"
      : isOwner
        ? "No upcoming booked appointments"
        : "No upcoming bookings";
  const emptyCopy = !hasTypeFilters
    ? "Choose at least one booking type to show appointments."
    : selectedDayKey
      ? isOwner
        ? "There are no booked appointments on this day. The calendar may still show available OH."
        : "Choose another day or return to the full list."
      : isOwner
        ? "New student reservations will appear here."
        : "Reserve an office-hour slot to start building your schedule.";
  const emptyAction = !hasTypeFilters ? (
    <button
      className="button button-primary dashboard-card-link"
      onClick={handleSelectAllTypes}
      type="button"
    >
      Show all types
    </button>
  ) : !selectedDayKey && !isOwner ? (
    <Link
      className="button button-primary dashboard-card-link"
      to="/app/owners"
    >
      Browse owners
    </Link>
  ) : null;

  const handleToggleType = (typeId) => {
    setSelectedBookingTypeIds((currentTypeIds) =>
      currentTypeIds.includes(typeId)
        ? currentTypeIds.filter((currentTypeId) => currentTypeId !== typeId)
        : [...currentTypeIds, typeId],
    );
  };

  const handleSelectAllTypes = () => {
    setSelectedBookingTypeIds(allBookingTypeIds);
  };

  const handleCancelEvent = async (event) => {
    const shouldCancel = await confirm({
      confirmLabel: "Cancel booking",
      message: isOwner
        ? "The booking will be cancelled and the slot will be removed."
        : "Your booking will be cancelled.",
      title: "Cancel this booking?",
    });

    if (!shouldCancel) {
      return;
    }

    setCancellingEventId(event.id);

    try {
      const endpoint = isOwner
        ? `/slots/${event.id}`
        : `/slots/${event.id}/cancel-booking`;
      const method = "DELETE";
      const data = await apiRequest(endpoint, method);
      const notifyAction = createMailtoAction(
        isOwner ? data.notifyEmail : data.notifyOwnerEmail,
        isOwner ? "Email student" : "Email owner",
      );

      await loadEvents();
      notify({
        actions: notifyAction ? [notifyAction] : [],
        message: isOwner
          ? "Booking cancelled and slot removed."
          : "Booking cancelled.",
        tone: "success",
      });
    } catch (error) {
      notify({ message: error.message, tone: "error" });
    } finally {
      setCancellingEventId("");
    }
  };
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await apiRequest("/teams");
        setTeams(Array.isArray(data) ? data : []);
      } catch {
        setTeams([]);
      }
    };

    loadTeams();
  }, []);

  useEffect(() => {
    if (loadingEvents) {
      setScheduleContentMaxHeight(0);
      setHasOverflowingSchedule(false);
      return undefined;
    }

    const updateScheduleHeight = () => {
      const primaryColumnHeight = primaryColumnRef.current?.offsetHeight || 0;
      const scheduleHeight = scheduleCardRef.current?.offsetHeight || 0;
      const visibleContentHeight = scheduleContentRef.current?.offsetHeight || 0;
      const fullContentHeight = scheduleContentRef.current?.scrollHeight || 0;

      if (!primaryColumnHeight || !scheduleHeight || !visibleContentHeight) {
        setScheduleContentMaxHeight(0);
        setHasOverflowingSchedule(false);
        return;
      }

      const reservedHeight = scheduleHeight - visibleContentHeight;
      const nextContentMaxHeight = Math.max(primaryColumnHeight - reservedHeight, 0);

      setScheduleContentMaxHeight(nextContentMaxHeight);
      setHasOverflowingSchedule(fullContentHeight > nextContentMaxHeight + 4);
    };

    updateScheduleHeight();

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          updateScheduleHeight();
        });

    if (resizeObserver) {
      if (primaryColumnRef.current) {
        resizeObserver.observe(primaryColumnRef.current);
      }

      if (scheduleCardRef.current) {
        resizeObserver.observe(scheduleCardRef.current);
      }

      if (scheduleContentRef.current) {
        resizeObserver.observe(scheduleContentRef.current);
      }
    }

    window.addEventListener("resize", updateScheduleHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScheduleHeight);
    };
  }, [
    groupedEvents.length,
    loadingEvents,
    selectedDayKey,
    selectedBookingTypeIds,
    showAllSchedule,
    teams.length
  ]);

  if (loadingEvents) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="Dashboard"
        title={`${currentUser.name}'s dashboard`}
      />

      <section className="dashboard-card dashboard-filter-card">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">Calendar filter</p>
            <h2>Booking types</h2>
          </div>
        </div>

        <BookingTypeFilter
          countsByType={countsByType}
          onSelectAll={handleSelectAllTypes}
          onToggleType={handleToggleType}
          selectedTypeIds={selectedBookingTypeIds}
        />
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-column" ref={primaryColumnRef}>
          <ScheduleCalendar
            items={typeFilteredCalendarEvents}
            onDaySelect={setSelectedDayKey}
            selectedDayKey={selectedDayKey}
          />

          {!isOwner && (
            <section className="dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <p className="eyebrow">Teams</p>
                  <h2>Your teams</h2>
                </div>

                <Link to="/app/teams" className="text-link">
                  View all
                </Link>
              </div>

              {teams.length ? (
                <div className="dashboard-event-list">
                  {teams.slice(0, 2).map((team) => (
                    <article className="dashboard-event-row" key={team._id}>
                      <div className="dashboard-event-main">
                        <div className="dashboard-event-head">
                          <h3>{team.teamName}</h3>
                          <span className="dashboard-badge">
                            {team.members?.length || 0}/{team.maxMembers}
                          </span>
                        </div>

                        <p>{team.courseNumber}</p>
                        <p>{team.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <h3>No teams yet</h3>
                  <p>Join or create a team to get started.</p>

                  <Link to="/app/teams" className="button button-primary">
                    Browse teams
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>

        <SchedulePanel
          collapsed={!showAllSchedule && hasOverflowingSchedule}
          contentRef={scheduleContentRef}
          contentStyle={!showAllSchedule && hasOverflowingSchedule && scheduleContentMaxHeight
            ? { maxHeight: `${scheduleContentMaxHeight}px` }
            : undefined}
          emptyAction={emptyAction}
          emptyCopy={emptyCopy}
          emptyTitle={emptyTitle}
          groupedEvents={groupedEvents}
          heading={eventsHeading}
          onClearSelectedDay={() => setSelectedDayKey("")}
          onToggleExpanded={() => setShowAllSchedule((currentValue) => !currentValue)}
          panelRef={scheduleCardRef}
          renderActions={(event) => (
            <>
              {event.withEmail ? (
                <a
                  className="text-link"
                  href={`mailto:${event.withEmail}`}
                >
                  {isOwner ? "Email student" : "Email owner"}
                </a>
              ) : (
                <span className="text-link">Email unavailable</span>
              )}

              {event.isPast ? (
                <span className="booking-status-text">
                  Completed
                </span>
              ) : (
                <button
                  className="text-link booking-cancel-button"
                  disabled={cancellingEventId === event.id}
                  onClick={() => handleCancelEvent(event)}
                  type="button"
                >
                  {cancellingEventId === event.id
                    ? "Cancelling"
                    : "Cancel booking"}
                </button>
              )}
            </>
          )}
          renderBody={(event) => (
            <>
              <div className="dashboard-event-head">
                <h3>{event.title}</h3>

                <span
                  className={`dashboard-badge${event.isPast ? " dashboard-badge-muted" : ""}`}
                >
                  {event.statusLabel}
                </span>
              </div>

              <p>
                {isOwner
                  ? `Student: ${event.withName}`
                  : `Owner: ${event.withName}`}
              </p>

              <p>{event.note}</p>
            </>
          )}
          renderTimeMeta={(event) => event.location}
          rowClassName={(event) => event.isPast ? "dashboard-event-row-past" : ""}
          selectedDayKey={selectedDayKey}
          showOverflowToggle={hasOverflowingSchedule}
          showOverflowToggleLabel={showAllSchedule ? "Show less" : "Show more"}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
