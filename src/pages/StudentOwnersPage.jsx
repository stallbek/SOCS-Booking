import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/api';
import BookingTypeSelector from '../components/ownerAvailability/BookingTypeSelector';
import StudentGroupMeetingPanel from '../components/meeting/StudentGroupMeetingPanel';
import StudentMeetingRequestPanel from '../components/meeting/StudentMeetingRequestPanel';
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
  filterOfficeHoursSlots,
  getBookingTypeFromSlot,
  getItemId,
  getSlotDateTimes,
  getStudentSlotState
} from '../utils/bookings';

const studentBookingTypes = [
  {
    id: 'type-1',
    label: 'Type 1',
    title: 'Request meeting',
    copy: 'Ask an owner for a specific meeting time and wait for approval.'
  },
  {
    id: 'type-2',
    label: 'Type 2',
    title: 'Group meeting',
    copy: 'Use an invite code and vote for the times that work for you.'
  },
  {
    id: 'type-3',
    label: 'Type 3',
    title: 'Office hours',
    copy: 'Choose an open OH slot from an owner calendar and reserve it directly.'
  }
];

function mapPublicSlotToEvent(slot, currentUserId) {
  const { startAt, endAt } = getSlotDateTimes(slot);
  const slotState = getStudentSlotState(slot, currentUserId);

  return {
    id: getItemId(slot),
    bookingType: getBookingTypeFromSlot(slot),
    title: slot.title,
    startAt,
    endAt,
    description: slot.description || '',
    ownerName: slot.owner?.name || '',
    ownerEmail: slot.owner?.email || '',
    ...slotState
  };
}

function StudentOwnersPage() {
  const { currentUser } = useSession();
  const [searchParams] = useSearchParams();
  const isStudent = currentUser.role === 'user';
  const [selectedBookingTypeId, setSelectedBookingTypeId] = useState(() => (
    searchParams.get('groupCode') ? 'type-2' : 'type-1'
  ));
  const [owners, setOwners] = useState([]);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [loadingOwners, setLoadingOwners] = useState(isStudent);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [bookingSlotId, setBookingSlotId] = useState('');
  const [noticeActions, setNoticeActions] = useState([]);

  const loadOwners = async () => {
    if (!isStudent) {
      return;
    }

    setLoadingOwners(true);

    try {
      const data = await apiRequest('/slots/public/owners');
      const nextOwners = Array.isArray(data) ? data : [];

      setOwners(nextOwners);
      setSelectedOwnerId((currentValue) => {
        if (currentValue && nextOwners.some((owner) => getItemId(owner) === currentValue)) {
          return currentValue;
        }

        return nextOwners[0] ? getItemId(nextOwners[0]) : '';
      });
    } catch (error) {
      setFeedback(error.message);
      setOwners([]);
      setSelectedOwnerId('');
    } finally {
      setLoadingOwners(false);
    }
  };

  const loadOwnerSlots = async (ownerId) => {
    if (!ownerId) {
      setSelectedOwner(null);
      setOwnerSlots([]);
      return;
    }

    setLoadingSlots(true);

    try {
      const data = await apiRequest(`/slots/public/owner/${ownerId}/slots`);
      setSelectedOwner(data.owner || null);
      setOwnerSlots(filterOfficeHoursSlots(data.slots));
    } catch (error) {
      setFeedback(error.message);
      setSelectedOwner(null);
      setOwnerSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }

    setSelectedDayKey('');
    loadOwnerSlots(selectedOwnerId);
  }, [isStudent, selectedOwnerId]);

  const filteredOwners = useMemo(() => {
    const query = ownerSearch.trim().toLowerCase();

    return [...owners]
      .sort((firstOwner, secondOwner) => firstOwner.name.localeCompare(secondOwner.name))
      .filter((owner) => {
        if (!query) {
          return true;
        }

        return owner.name.toLowerCase().includes(query) || owner.email.toLowerCase().includes(query);
      });
  }, [ownerSearch, owners]);

  const events = useMemo(
    () => ownerSlots.map((slot) => mapPublicSlotToEvent(slot, currentUser.id)),
    [ownerSlots, currentUser.id]
  );

  const visibleEvents = selectedDayKey
    ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : events;

  const groupedEvents = groupItemsByDay(visibleEvents);
  const openSlotCount = events.filter((event) => event.isBookable).length;
  const reservedSlotCount = events.filter((event) => event.isBooked).length;

  const scheduleHeading = selectedDayKey
    ? `Office hours on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : selectedOwner
      ? `${selectedOwner.name}'s office hours`
      : 'Office hours';

  const isType1 = selectedBookingTypeId === 'type-1';
  const isType2 = selectedBookingTypeId === 'type-2';
  const isType3 = selectedBookingTypeId === 'type-3';
  const shouldShowOwnerDirectory = isType1 || isType3;

  const handleBookSlot = async (slotId) => {
    setFeedback('');
    setNoticeActions([]);
    setBookingSlotId(slotId);

    try {
      const data = await apiRequest(`/slots/${slotId}/book`, 'POST');
      const notifyAction = createMailtoAction(data.notifyOwnerEmail, 'Email owner');

      setNoticeActions(notifyAction ? [notifyAction] : []);
      setFeedback('Slot reserved.');
      await loadOwnerSlots(selectedOwnerId);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBookingSlotId('');
    }
  };

  if (!isStudent) {
    return (
      <div className="dashboard-page student-owners-page">
        <section className="dashboard-card dashboard-intro-card">
          <p className="eyebrow">Owners</p>
          <h1>Student account required.</h1>
          <p className="dashboard-copy">
            Student booking is available for McGill student accounts. Owner accounts manage availability from the dashboard.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page student-owners-page">
      <section className="dashboard-card dashboard-intro-card">
        <p className="eyebrow">Student booking</p>
        <h1>Choose booking type.</h1>
        <p className="dashboard-copy">
          Start with Type 1 requests, Type 2 group voting, or Type 3 office-hour reservations.
        </p>
      </section>

      <BookingTypeSelector
        bookingTypeOptions={studentBookingTypes}
        label="Student booking types"
        onSelectBookingType={setSelectedBookingTypeId}
        selectedBookingTypeId={selectedBookingTypeId}
      />

      {shouldShowOwnerDirectory ? (
        <section className="dashboard-card owner-directory-card">
          <div className="dashboard-card-head">
            <div>
              <p className="eyebrow">Owners</p>
              <h2>Choose an owner</h2>
            </div>
          </div>

          <div className="owner-directory-toolbar">
            <label className="form-field owner-search-field">
              <span>Search owners</span>
              <input
                onChange={(event) => setOwnerSearch(event.target.value)}
                placeholder="Search by name"
                type="search"
                value={ownerSearch}
              />
            </label>

            <p className="owner-directory-count">
              {filteredOwners.length} of {owners.length} owner{owners.length === 1 ? '' : 's'}
            </p>
          </div>

          {loadingOwners ? (
            <div className="dashboard-empty-state">
              <h3>Loading owners</h3>
              <p>Checking the owner directory.</p>
            </div>
          ) : owners.length ? (
            filteredOwners.length ? (
            <div className="owner-directory-grid">
              {filteredOwners.map((owner) => {
                const ownerId = getItemId(owner);
                const isSelected = ownerId === selectedOwnerId;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={`owner-directory-item${isSelected ? ' owner-directory-item-active' : ''}`}
                    key={ownerId}
                    onClick={() => setSelectedOwnerId(ownerId)}
                    type="button"
                  >
                    <span className="owner-directory-label">Owner</span>
                    <strong>{owner.name}</strong>
                    <span>{owner.email}</span>
                  </button>
                );
              })}
            </div>
            ) : (
              <div className="dashboard-empty-state">
                <h3>No owners match</h3>
                <p>Try another name or clear the search to browse available owners.</p>
                <button className="text-link dashboard-show-all" onClick={() => setOwnerSearch('')} type="button">
                  Clear search
                </button>
              </div>
            )
          ) : (
            <div className="dashboard-empty-state">
              <h3>No owners found</h3>
              <p>No owner accounts are available in the booking directory yet.</p>
            </div>
          )}
        </section>
      ) : null}

      {shouldShowOwnerDirectory && selectedOwner ? (
        <section className="dashboard-card owner-summary-card">
          <div>
            <p className="eyebrow">Selected owner</p>
            <h2>{selectedOwner.name}</h2>
            <p className="dashboard-copy">{selectedOwner.email}</p>
          </div>

          {isType3 ? (
            <div className="owner-summary-stats" aria-label="Office hour summary">
              <div className="owner-summary-stat">
                <span>Open</span>
                <strong>{openSlotCount}</strong>
              </div>
              <div className="owner-summary-stat">
                <span>Reserved</span>
                <strong>{reservedSlotCount}</strong>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {isType1 ? <StudentMeetingRequestPanel selectedOwner={selectedOwner} /> : null}
      {isType2 ? <StudentGroupMeetingPanel /> : null}

      {isType3 ? (
        <div className="dashboard-layout">
          <ScheduleCalendar
            items={events}
            onDaySelect={setSelectedDayKey}
            selectedDayKey={selectedDayKey}
            title={selectedOwner ? `${selectedOwner.name}'s calendar` : undefined}
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

            {loadingSlots ? (
              <div className="dashboard-empty-state">
                <h3>Loading slots</h3>
                <p>Checking the selected owner's office-hour schedule.</p>
              </div>
            ) : groupedEvents.length ? (
              <div className="dashboard-event-groups">
                {groupedEvents.map((group) => (
                  <div className="dashboard-event-group" key={group.dayKey}>
                    {!selectedDayKey ? <h3 className="dashboard-group-label">{group.label}</h3> : null}

                    <div className="dashboard-event-list">
                      {group.items.map((event) => (
                        <article
                          className={`dashboard-event-row student-owner-event-row${event.isPast ? ' dashboard-event-row-past' : ''}`}
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

                            {event.description ? <p>{event.description}</p> : null}
                            <p>{event.note}</p>
                          </div>

                          <div className="dashboard-event-actions student-owner-actions">
                            {event.ownerEmail ? (
                              <a className="text-link" href={`mailto:${event.ownerEmail}`}>
                                Email owner
                              </a>
                            ) : null}

                            {event.isBooked ? (
                              event.isMine ? (
                                <Link className="text-link" to="/app/bookings">
                                  View booking
                                </Link>
                              ) : (
                                <span className="booking-status-text">Already booked</span>
                              )
                            ) : event.isPast ? (
                              <span className="booking-status-text">Slot passed</span>
                            ) : (
                              <button
                                className="button button-primary student-book-button"
                                disabled={bookingSlotId === event.id}
                                onClick={() => handleBookSlot(event.id)}
                                type="button"
                              >
                                {bookingSlotId === event.id ? 'Booking' : 'Book slot'}
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
                <h3>No slots found</h3>
                <p>
                  {selectedDayKey
                    ? 'This owner has no office-hour slots on the selected day.'
                    : 'This owner has no published office-hour slots right now.'}
                </p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default StudentOwnersPage;
