import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/api';
import ScheduleCalendar from '../components/app/ScheduleCalendar';
import { useSession } from '../context/SessionContext';
import {
  buildDateTime,
  formatLongDate,
  formatTimeRange,
  getDayKey,
  groupItemsByDay,
  parseDayKey
} from '../utils/date';

function mapOwnerAppointmentToEvent(slot) {
  const bookedName = slot.bookedByName || slot.bookedBy?.name || '';
  const bookedEmail = slot.bookedByEmail || slot.bookedBy?.email || '';

  return {
    id: slot._id,
    title: slot.title,
    startAt: buildDateTime(slot.date, slot.startTime),
    endAt: buildDateTime(slot.date, slot.endTime),
    location: 'Booked appointment',
    note: slot.description || 'Student reservation confirmed.',
    withName: bookedName || 'Student',
    withEmail: bookedEmail
  };
}

function mapStudentAppointmentToEvent(slot) {
  return {
    id: slot._id,
    title: slot.title,
    startAt: buildDateTime(slot.date, slot.startTime),
    endAt: buildDateTime(slot.date, slot.endTime),
    location: slot.slotType === 'office-hours' ? 'Office hours' : 'Reserved appointment',
    note: slot.description || 'Owner reservation confirmed.',
    withName: slot.owner?.name || 'Owner',
    withEmail: slot.owner?.email || ''
  };
}

function DashboardPage() {

  const { currentUser } = useSession();
  const isOwner = currentUser.role === 'owner';
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true);

      try {
        if (isOwner) {
          const data = await apiRequest('/slots/mine/details');
          const bookedSlots = data.filter((slot) => slot.isBooked || slot.bookedBy || slot.bookedByName);
          setEvents(bookedSlots.map(mapOwnerAppointmentToEvent));
        } else {
          const data = await apiRequest('/slots/bookings/mine');
          setEvents(data.map(mapStudentAppointmentToEvent));
        }
      } catch (error) {
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [isOwner]);

  const visibleEvents = selectedDayKey
    ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : events;

  const groupedEvents = groupItemsByDay(visibleEvents);

  const eventsHeading = selectedDayKey
    ? `Events on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : isOwner
      ? 'Booked appointments'
      : 'Reserved appointments';

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
            ? 'Booked student appointments appear here.'
            : 'Your reserved appointments appear here.'}
        </p>

      </section>

      <div className="dashboard-layout">

        <ScheduleCalendar
          items={events}
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
                        className="dashboard-event-row"
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

                            <span className="dashboard-badge">
                              {isOwner ? 'Booked' : 'Reserved'}
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

                        </div>

                      </article>
                    ))}

                  </div>

                </div>
              ))}

            </div>

          ) : (

            <div className="dashboard-empty-state">
              <h3>{isOwner ? 'No booked appointments yet' : 'No bookings yet'}</h3>
              <p>
                {selectedDayKey
                  ? 'Choose another day or return to the full list.'
                  : isOwner
                    ? 'New student reservations will appear here.'
                    : 'Reserve an office-hour slot to start building your schedule.'}
              </p>

              {!selectedDayKey && !isOwner ? (
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
