import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/api';
import ScheduleCalendar from '../components/ScheduleCalendar';
import { useSession } from '../context/SessionContext';
import {
  buildDateTime,
  formatLongDate,
  formatTimeRange,
  getDayKey,
  groupItemsByDay,
  parseDayKey
} from '../utils/date';

function filterOfficeHoursSlots(slots) {
  return (Array.isArray(slots) ? slots : []).filter((slot) => slot.slotType === 'office-hours');
}

function mapBookingToEvent(slot) {
  return {
    id: slot._id,
    title: slot.title,
    startAt: buildDateTime(slot.date, slot.startTime),
    endAt: buildDateTime(slot.date, slot.endTime),
    description: slot.description || '',
    ownerName: slot.owner?.name || 'Owner',
    ownerEmail: slot.owner?.email || '',
    statusLabel: 'Reserved',
    note: 'Reserved office-hour slot.'
  };
}

function StudentBookingsPage() {
  const { currentUser } = useSession();
  const isStudent = currentUser.role === 'user';
  const [bookings, setBookings] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(isStudent);
  const [feedback, setFeedback] = useState('');
  const [cancelSlotId, setCancelSlotId] = useState('');

  const loadBookings = async () => {
    if (!isStudent) {
      return;
    }

    setLoadingBookings(true);

    try {
      const data = await apiRequest('/slots/bookings/mine');
      setBookings(filterOfficeHoursSlots(data));
    } catch (error) {
      setFeedback(error.message);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [isStudent]);

  const events = useMemo(() => bookings.map(mapBookingToEvent), [bookings]);

  const visibleEvents = selectedDayKey
    ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : events;

  const groupedEvents = groupItemsByDay(visibleEvents);
  const ownerCount = new Set(events.map((event) => event.ownerEmail).filter(Boolean)).size;

  const scheduleHeading = selectedDayKey
    ? `Bookings on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : 'My bookings';

  const handleCancelBooking = async (slotId) => {
    const shouldCancel = window.confirm('Cancel this booking?');

    if (!shouldCancel) {
      return;
    }

    setFeedback('');
    setCancelSlotId(slotId);

    try {
      await apiRequest(`/slots/${slotId}/cancel-booking`, 'DELETE');
      setFeedback('Booking cancelled.');
      await loadBookings();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setCancelSlotId('');
    }
  };

  if (!isStudent) {
    return (
      <div className="dashboard-page student-bookings-page">
        <section className="dashboard-card dashboard-intro-card">
          <p className="eyebrow">Bookings</p>
          <h1>Student account required.</h1>
          <p className="dashboard-copy">
            Reserved office-hour slots are shown for student accounts. Owner accounts review appointments from the dashboard.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page student-bookings-page">
      <section className="dashboard-card dashboard-intro-card">
        <p className="eyebrow">Type 3 booking</p>
        <h1>Manage office-hour bookings.</h1>
        <p className="dashboard-copy">
          Review your reserved office hours, email the owner, or cancel a reservation you no longer need.
        </p>
      </section>

      <section className="dashboard-card owner-summary-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>{events.length} active office-hour booking{events.length === 1 ? '' : 's'}</h2>
          <p className="dashboard-copy">
            {ownerCount} owner{ownerCount === 1 ? '' : 's'} in your current schedule.
          </p>
        </div>

        <div className="owner-summary-stats" aria-label="Booking summary">
          <div className="owner-summary-stat">
            <span>Appointments</span>
            <strong>{events.length}</strong>
          </div>
          <div className="owner-summary-stat">
            <span>Owners</span>
            <strong>{ownerCount}</strong>
          </div>
        </div>
      </section>

      <div className="dashboard-layout">
        <ScheduleCalendar
          items={events}
          onDaySelect={setSelectedDayKey}
          selectedDayKey={selectedDayKey}
          title="Reserved schedule"
        />

        <section className="dashboard-card events-card">
          <div className="dashboard-card-head">
            <div>
              <p className="eyebrow">Schedule</p>
              <h2>{scheduleHeading}</h2>
            </div>

            {selectedDayKey ? (
              <button
                className="text-link dashboard-show-all"
                onClick={() => setSelectedDayKey('')}
                type="button"
              >
                Show all
              </button>
            ) : null}
          </div>

          {feedback ? <div className="auth-notice">{feedback}</div> : null}

          {loadingBookings ? (
            <div className="dashboard-empty-state">
              <h3>Loading bookings</h3>
              <p>Checking your reserved office-hour schedule.</p>
            </div>
          ) : groupedEvents.length ? (
            <div className="dashboard-event-groups">
              {groupedEvents.map((group) => (
                <div className="dashboard-event-group" key={group.dayKey}>
                  {!selectedDayKey ? <h3 className="dashboard-group-label">{group.label}</h3> : null}

                  <div className="dashboard-event-list">
                    {group.items.map((event) => (
                      <article className="dashboard-event-row student-booking-event-row" key={event.id}>
                        <div className="dashboard-event-time">
                          <strong>{formatTimeRange(event.startAt, event.endAt)}</strong>
                          <span>{event.statusLabel}</span>
                        </div>

                        <div className="dashboard-event-main">
                          <div className="dashboard-event-head">
                            <h3>{event.title}</h3>
                            <span className="dashboard-badge">{event.statusLabel}</span>
                          </div>

                          <p>Owner: {event.ownerName}</p>
                          {event.description ? <p>{event.description}</p> : null}
                          <p>{event.note}</p>
                        </div>

                        <div className="dashboard-event-actions booking-event-actions">
                          {event.ownerEmail ? (
                            <a className="text-link" href={`mailto:${event.ownerEmail}`}>
                              Email owner
                            </a>
                          ) : null}

                          <button
                            className="text-link booking-cancel-button"
                            disabled={cancelSlotId === event.id}
                            onClick={() => handleCancelBooking(event.id)}
                            type="button"
                          >
                            {cancelSlotId === event.id ? 'Cancelling' : 'Cancel booking'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <h3>No bookings yet</h3>
              <p>Reserve an office-hour slot to start building your schedule.</p>
              <Link className="button button-primary dashboard-card-link" to="/app/owners">
                Browse owners
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default StudentBookingsPage;
