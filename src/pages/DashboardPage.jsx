import { useEffect, useState } from 'react';
import ScheduleCalendar from '../components/app/ScheduleCalendar';
import { useSession } from '../context/SessionContext';
import {
  formatLongDate,
  formatTimeRange,
  getDayKey,
  groupItemsByDay,
  parseDayKey
} from '../utils/date';

function mapSlotToEvent(slot) {

  //convert backend slot into calendar event
  return {
    id: slot._id,
    title: slot.title,
    startAt: `${slot.date}T${slot.startTime}:00`,
    endAt: `${slot.date}T${slot.endTime}:00`,
    location: 'TBD',
    note: slot.isAvailable ? 'Available slot' : 'Booked slot',
    withName: 'Not available yet',
    withEmail: ''
  };
}

function DashboardPage() {

  //get logged in user
  const { currentUser } = useSession();

  //check role
  const isOwner = currentUser.role === 'owner';

  //selected day on calendar
  const [selectedDayKey, setSelectedDayKey] = useState('');

  //all events from backend
  const [events, setEvents] = useState([]);

  //loading state
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {

    //load user slots
    const loadEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/slots/mine', {
          credentials: 'include'
        });

        //if request failed just clear events
        if (!response.ok) {
          setEvents([]);
          return;
        }

        const data = await response.json();

        //convert slots to frontend format
        const mappedEvents = data.map(mapSlotToEvent);

        setEvents(mappedEvents);

      } catch (error) {

        //server/network issue
        setEvents([]);

      } finally {

        //done loading
        setLoadingEvents(false);
      }
    };

    loadEvents();

  }, []);

  //if day selected only show those events
  const visibleEvents = selectedDayKey
    ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : events;

  //group events by date
  const groupedEvents = groupItemsByDay(visibleEvents);

  //heading text changes depending on filter and role
  const eventsHeading = selectedDayKey
    ? `Events on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : isOwner
      ? 'All booked appointments'
      : 'All reserved appointments';

  //loading screen
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
            ? 'Your schedule and booked appointments.'
            : 'Your schedule and reserved appointments.'}
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
              <h3>Nothing</h3>
              <p>Choose another day or return to the full list.</p>
            </div>

          )}

        </section>

      </div>

    </div>
  );
}

export default DashboardPage;
