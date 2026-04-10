import { useMemo, useState } from 'react';
import ScheduleCalendar from '../components/app/ScheduleCalendar';
import { useSession } from '../context/SessionContext';
import { formatLongDate, formatTimeRange, getDayKey, groupItemsByDay, parseDayKey } from '../utils/date';

function createDateTime(dayOffset, hour, minute) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function getOwnerEvents() {
  return [
    {
      id: 'owner-event-1',
      title: 'COMP 307 office hour',
      withName: 'Jamie Ross',
      withEmail: 'jamie.ross@mail.mcgill.ca',
      location: 'Trottier 3120',
      note: 'Project structure questions.',
      startAt: createDateTime(1, 10, 0),
      endAt: createDateTime(1, 10, 30),
    },
    {
      id: 'owner-event-2',
      title: 'Assignment review',
      withName: 'Mina Patel',
      withEmail: 'mina.patel@mail.mcgill.ca',
      location: 'Trottier 3120',
      note: 'Short review before submission.',
      startAt: createDateTime(1, 14, 0),
      endAt: createDateTime(1, 14, 30),
    },
    {
      id: 'owner-event-3',
      title: 'Office hour',
      withName: 'Leo Martin',
      withEmail: 'leo.martin@mail.mcgill.ca',
      location: 'McConnell 11',
      note: 'Questions about recursion.',
      startAt: createDateTime(3, 11, 0),
      endAt: createDateTime(3, 11, 30),
    },
    {
      id: 'owner-event-4',
      title: 'Project milestone check',
      withName: 'Sara Wong',
      withEmail: 'sara.wong@mail.mcgill.ca',
      location: 'Online',
      note: 'Demo preparation.',
      startAt: createDateTime(6, 15, 0),
      endAt: createDateTime(6, 15, 30),
    },
  ];
}

function getStudentEvents() {
  return [
    {
      id: 'student-event-1',
      title: 'Office hour',
      withName: 'Prof. Maya Chen',
      withEmail: 'maya.chen@mcgill.ca',
      location: 'Trottier 2100',
      note: 'Discuss lab feedback.',
      startAt: createDateTime(1, 9, 30),
      endAt: createDateTime(1, 10, 0),
    },
    {
      id: 'student-event-2',
      title: 'TA support slot',
      withName: 'Alex Gagnon',
      withEmail: 'alex.gagnon@mcgill.ca',
      location: 'Online',
      note: 'Walk through test cases.',
      startAt: createDateTime(2, 13, 0),
      endAt: createDateTime(2, 13, 30),
    },
    {
      id: 'student-event-3',
      title: 'Project check-in',
      withName: 'Prof. Maya Chen',
      withEmail: 'maya.chen@mcgill.ca',
      location: 'Trottier 2100',
      note: 'Progress update.',
      startAt: createDateTime(4, 11, 30),
      endAt: createDateTime(4, 12, 0),
    },
    {
      id: 'student-event-4',
      title: 'Exam prep office hour',
      withName: 'Nora Singh',
      withEmail: 'nora.singh@mcgill.ca',
      location: 'Burnside 1205',
      note: 'Final questions.',
      startAt: createDateTime(7, 16, 0),
      endAt: createDateTime(7, 16, 30),
    },
  ];
}

function DashboardPage() {
  const { currentUser } = useSession();
  const isOwner = currentUser.role === 'owner';
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const events = useMemo(() => (isOwner ? getOwnerEvents() : getStudentEvents()), [isOwner]);
  const visibleEvents = selectedDayKey ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey) : events;
  const groupedEvents = groupItemsByDay(visibleEvents);
  const eventsHeading = selectedDayKey
    ? `Events on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : isOwner
      ? 'All booked appointments'
      : 'All reserved appointments';

  return (
    <div className="dashboard-page">
      <section className="dashboard-card dashboard-intro-card">
        <p className="eyebrow">{isOwner ? 'Owner dashboard' : 'Student dashboard'}</p>
        <h1>{currentUser.name}</h1>
        <p className="dashboard-copy">
          {isOwner
            ? 'Your schedule and booked appointments.'
            : 'Your schedule and reserved appointments.'}
        </p>
      </section>

      <div className="dashboard-layout">
        <ScheduleCalendar items={events} onDaySelect={setSelectedDayKey} selectedDayKey={selectedDayKey} />

        <section className="dashboard-card events-card">
          <div className="dashboard-card-head">
            <div>
              <p className="eyebrow">Schedule</p>
              <h2>{eventsHeading}</h2>
            </div>

            {selectedDayKey ? (
              <button className="text-link dashboard-show-all" onClick={() => setSelectedDayKey('')} type="button">
                Show all
              </button>
            ) : null}
          </div>

          {groupedEvents.length ? (
            <div className="dashboard-event-groups">
              {groupedEvents.map((group) => (
                <div className="dashboard-event-group" key={group.dayKey}>
                  {!selectedDayKey ? <h3 className="dashboard-group-label">{group.label}</h3> : null}

                  <div className="dashboard-event-list">
                    {group.items.map((event) => (
                      <article className="dashboard-event-row" key={event.id}>
                        <div className="dashboard-event-time">
                          <strong>{formatTimeRange(event.startAt, event.endAt)}</strong>
                          <span>{event.location}</span>
                        </div>

                        <div className="dashboard-event-main">
                          <div className="dashboard-event-head">
                            <h3>{event.title}</h3>
                            <span className="dashboard-badge">{isOwner ? 'Booked' : 'Reserved'}</span>
                          </div>
                          <p>{isOwner ? `Student: ${event.withName}` : `Owner: ${event.withName}`}</p>
                          <p>{event.note}</p>
                        </div>

                        <div className="dashboard-event-actions">
                          <a className="text-link" href={`mailto:${event.withEmail}`}>
                            {isOwner ? 'Email student' : 'Email owner'}
                          </a>
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
