import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/api';
import BookingTypeFilter from '../components/BookingTypeFilter';
import NotificationActions from '../components/NotificationActions';
import ScheduleCalendar from '../components/ScheduleCalendar';
import { useSession } from '../context/SessionContext';
import {
  formatLongDate,
  formatTimeRange,
  getDayKey,
  groupItemsByDay,
  parseDayKey
} from '../utils/date';
import {
  allBookingTypeIds,
  createMailtoAction,
  isOfficeHoursSlot,
  mapOwnerAppointmentEvent,
  mapOwnerCalendarEvent,
  mapStudentAppointmentEvent
} from '../utils/bookings';

function DashboardPage() {

  const { currentUser } = useSession();
  const isOwner = currentUser.role === 'owner';
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [selectedBookingTypeIds, setSelectedBookingTypeIds] = useState(allBookingTypeIds);
  const [events, setEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [actionFeedback, setActionFeedback] = useState('');
  const [noticeActions, setNoticeActions] = useState([]);
  const [cancellingEventId, setCancellingEventId] = useState('');

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);

    try {
      if (isOwner) {
        const data = await apiRequest('/slots/mine/details');
        const bookedSlots = data.filter((slot) => slot.isBooked || slot.bookedBy || slot.bookedByName);
        const ownerCalendarSlots = data.filter((slot) => (
          slot.isBooked || slot.bookedBy || slot.bookedByName || isOfficeHoursSlot(slot)
        ));

        setEvents(bookedSlots.map(mapOwnerAppointmentEvent));
        setCalendarEvents(ownerCalendarSlots.map(mapOwnerCalendarEvent));
      } else {
        const data = await apiRequest('/slots/bookings/mine');
        const studentEvents = data.map(mapStudentAppointmentEvent);

        setEvents(studentEvents);
        setCalendarEvents(studentEvents);
      }
    } catch (error) {
      setEvents([]);
      setCalendarEvents([]);
      setActionFeedback(error.message);
    } finally {
      setLoadingEvents(false);
    }
  }, [isOwner]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const selectedBookingTypes = useMemo(() => new Set(selectedBookingTypeIds), [selectedBookingTypeIds]);

  const countsByType = useMemo(() => calendarEvents.reduce((counts, event) => ({
    ...counts,
    [event.bookingType]: (counts[event.bookingType] || 0) + 1
  }), {}), [calendarEvents]);

  const typeFilteredEvents = useMemo(() => (
    events.filter((event) => selectedBookingTypes.has(event.bookingType))
  ), [events, selectedBookingTypes]);

  const typeFilteredCalendarEvents = useMemo(() => (
    calendarEvents.filter((event) => selectedBookingTypes.has(event.bookingType))
  ), [calendarEvents, selectedBookingTypes]);

  const visibleEvents = selectedDayKey
    ? typeFilteredEvents.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : typeFilteredEvents;

  const groupedEvents = groupItemsByDay(visibleEvents);
  const hasTypeFilters = selectedBookingTypeIds.length > 0;

  const eventsHeading = selectedDayKey
    ? `Events on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : isOwner
      ? 'Booked appointments'
      : 'Reserved appointments';

  const handleToggleType = (typeId) => {
    setSelectedBookingTypeIds((currentTypeIds) => (
      currentTypeIds.includes(typeId)
        ? currentTypeIds.filter((currentTypeId) => currentTypeId !== typeId)
        : [...currentTypeIds, typeId]
    ));
  };

  const handleSelectAllTypes = () => {
    setSelectedBookingTypeIds(allBookingTypeIds);
  };

  const handleCancelEvent = async (event) => {
    const shouldCancel = window.confirm(
      isOwner
        ? 'Cancel this booking and remove this slot?'
        : 'Cancel this booking?'
    );

    if (!shouldCancel) {
      return;
    }

    setActionFeedback('');
    setNoticeActions([]);
    setCancellingEventId(event.id);

    try {
      const endpoint = isOwner ? `/slots/${event.id}` : `/slots/${event.id}/cancel-booking`;
      const method = 'DELETE';
      const data = await apiRequest(endpoint, method);
      const notifyAction = createMailtoAction(
        isOwner ? data.notifyEmail : data.notifyOwnerEmail,
        isOwner ? 'Email student' : 'Email owner'
      );

      setNoticeActions(notifyAction ? [notifyAction] : []);
      setActionFeedback(isOwner ? 'Booking cancelled and slot removed.' : 'Booking cancelled.');
      await loadEvents();
    } catch (error) {
      setActionFeedback(error.message);
    } finally {
      setCancellingEventId('');
    }
  };

  if (loadingEvents) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">

      <section className="dashboard-card dashboard-intro-card">

        <p className="eyebrow">
          {isOwner ? 'Owner dashboard' : 'Student dashboard'}
        </p>

        <h1>{currentUser.name}</h1>

        <p className="dashboard-copy">
          {isOwner
            ? 'Booked student appointments appear here. Available OH dates stay visible on the calendar.'
            : 'Your reserved appointments appear here.'}
        </p>

      </section>

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

        <ScheduleCalendar
          items={typeFilteredCalendarEvents}
          onDaySelect={setSelectedDayKey}
          selectedDayKey={selectedDayKey}
        />

        <section className="dashboard-card events-card">

          <div className="dashboard-card-head">

            <div>
              <p className="eyebrow">Schedule</p>
              <h2>{eventsHeading}</h2>
            </div>

            {selectedDayKey ? (
              <button
                type="button"
                className="text-link dashboard-show-all"
                onClick={() => setSelectedDayKey('')}
              >
                Show all
              </button>
            ) : null}

          </div>

          {actionFeedback || noticeActions.length ? (
            <div className="auth-notice">
              {actionFeedback ? <span>{actionFeedback}</span> : null}
              <NotificationActions actions={noticeActions} />
            </div>
          ) : null}

          {groupedEvents.length ? (

            <div className="dashboard-event-groups">

              {groupedEvents.map((group) => (
                <div
                  className="dashboard-event-group"
                  key={group.dayKey}
                >

                  {!selectedDayKey ? (
                    <h3 className="dashboard-group-label">
                      {group.label}
                    </h3>
                  ) : null}

                  <div className="dashboard-event-list">

                    {group.items.map((event) => (
                      <article
                        className={`dashboard-event-row${event.isPast ? ' dashboard-event-row-past' : ''}`}
                        key={event.id}
                      >

                        <div className="dashboard-event-time">
                          <strong>
                            {formatTimeRange(event.startAt, event.endAt)}
                          </strong>

                          <span>{event.location}</span>
                        </div>

                        <div className="dashboard-event-main">

                          <div className="dashboard-event-head">

                            <h3>{event.title}</h3>

                            <span className={`dashboard-badge${event.isPast ? ' dashboard-badge-muted' : ''}`}>
                              {event.statusLabel}
                            </span>

                          </div>

                          <p>
                            {isOwner
                              ? `Student: ${event.withName}`
                              : `Owner: ${event.withName}`}
                          </p>

                          <p>{event.note}</p>

                        </div>

                        <div className="dashboard-event-actions">

                          {event.withEmail ? (
                            <a
                              className="text-link"
                              href={`mailto:${event.withEmail}`}
                            >
                              {isOwner ? 'Email student' : 'Email owner'}
                            </a>
                          ) : (
                            <span className="text-link">
                              Email unavailable
                            </span>
                          )}

                          {event.isPast ? (
                            <span className="booking-status-text">Completed</span>
                          ) : (
                            <button
                              className="text-link booking-cancel-button"
                              disabled={cancellingEventId === event.id}
                              onClick={() => handleCancelEvent(event)}
                              type="button"
                            >
                              {cancellingEventId === event.id ? 'Cancelling' : 'Cancel booking'}
                            </button>
                          )}

                        </div>

                      </article>
                    ))}

                  </div>

                </div>
              ))}

            </div>

          ) : (

            <div className="dashboard-empty-state">
              <h3>
                {!hasTypeFilters
                  ? 'No booking types selected'
                  : isOwner ? 'No booked appointments yet' : 'No bookings yet'}
              </h3>
              <p>
                {!hasTypeFilters
                  ? 'Choose at least one booking type to show appointments.'
                  : selectedDayKey
                  ? isOwner
                    ? 'There are no booked appointments on this day. The calendar may still show available OH.'
                    : 'Choose another day or return to the full list.'
                  : isOwner
                    ? 'New student reservations will appear here.'
                    : 'Reserve an office-hour slot to start building your schedule.'}
              </p>

              {!hasTypeFilters ? (
                <button className="button button-primary dashboard-card-link" onClick={handleSelectAllTypes} type="button">
                  Show all types
                </button>
              ) : !selectedDayKey && !isOwner ? (
                <Link className="button button-primary dashboard-card-link" to="/app/owners">
                  Browse owners
                </Link>
              ) : null}
            </div>

          )}

        </section>

      </div>

    </div>
  );
}

export default DashboardPage;
