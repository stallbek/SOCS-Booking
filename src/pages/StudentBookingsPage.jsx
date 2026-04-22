import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/api';
import StudentMeetingRequestsPanel from '../components/meeting/StudentMeetingRequestsPanel';
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
  createMailtoAction,
  hasSlotStarted,
  mapStudentAppointmentEvent
} from '../utils/bookings';

function mapBookingToEvent(slot) {
  const appointment = mapStudentAppointmentEvent(slot);
  const isPast = hasSlotStarted(slot);

  return {
    ...appointment,
    ownerName: slot.owner?.name || 'Owner',
    ownerEmail: slot.owner?.email || '',
    description: slot.description || '',
    isPast,
    note: isPast ? 'Reserved appointment has passed.' : 'Reserved appointment.'
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
  const [noticeActions, setNoticeActions] = useState([]);

  const loadBookings = async () => {
    if (!isStudent) {
      return;
    }

    setLoadingBookings(true);

    try {
      const data = await apiRequest('/slots/bookings/mine');
      setBookings(Array.isArray(data) ? data : []);
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
    setNoticeActions([]);
    setCancelSlotId(slotId);

    try {
      const data = await apiRequest(`/slots/${slotId}/cancel-booking`, 'DELETE');
      const notifyAction = createMailtoAction(data.notifyOwnerEmail, 'Email owner');

      setNoticeActions(notifyAction ? [notifyAction] : []);
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
            Student accounts can review accepted bookings and sent meeting requests.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page student-bookings-page">
      <section className="dashboard-card dashboard-intro-card">
        <p className="eyebrow">Student bookings</p>
        <h1>Manage bookings.</h1>
        <p className="dashboard-copy">
          Review accepted bookings, email the owner, cancel a reservation, and track Type 1 requests.
        </p>
      </section>

      <section className="dashboard-card owner-summary-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>{events.length} booking{events.length === 1 ? '' : 's'}</h2>
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

      <StudentMeetingRequestsPanel />

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

          {feedback || noticeActions.length ? (
            <div className="auth-notice">
              {feedback ? <span>{feedback}</span> : null}
              <NotificationActions actions={noticeActions} />
            </div>
          ) : null}

          {loadingBookings ? (
            <div className="dashboard-empty-state">
              <h3>Loading bookings</h3>
              <p>Checking your reserved appointment schedule.</p>
            </div>
          ) : groupedEvents.length ? (
            <div className="dashboard-event-groups">
              {groupedEvents.map((group) => (
                <div className="dashboard-event-group" key={group.dayKey}>
                  {!selectedDayKey ? <h3 className="dashboard-group-label">{group.label}</h3> : null}

                  <div className="dashboard-event-list">
                    {group.items.map((event) => (
                      <article
                        className={`dashboard-event-row student-booking-event-row${event.isPast ? ' dashboard-event-row-past' : ''}`}
                        key={event.id}
                      >
                        <div className="dashboard-event-time">
                          <strong>{formatTimeRange(event.startAt, event.endAt)}</strong>
                          <span>{event.statusLabel}</span>
                        </div>

                        <div className="dashboard-event-main">
                          <div className="dashboard-event-head">
                            <h3>{event.title}</h3>
                            <span className={`dashboard-badge${event.isPast ? ' dashboard-badge-muted' : ''}`}>
                              {event.statusLabel}
                            </span>
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

                          {event.isPast ? (
                            <span className="booking-status-text">Completed</span>
                          ) : (
                            <button
                              className="text-link booking-cancel-button"
                              disabled={cancelSlotId === event.id}
                              onClick={() => handleCancelBooking(event.id)}
                              type="button"
                            >
                              {cancelSlotId === event.id ? 'Cancelling' : 'Cancel booking'}
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
              <h3>No bookings yet</h3>
              <p>Accepted requests and reserved office-hour slots will appear here.</p>
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
