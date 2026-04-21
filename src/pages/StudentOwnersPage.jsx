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

function getItemId(value) {
  return value?._id || value?.id || '';
}

function getBookedById(slot) {
  if (!slot.bookedBy) {
    return '';
  }

  if (typeof slot.bookedBy === 'string') {
    return slot.bookedBy;
  }

  return getItemId(slot.bookedBy);
}

function filterOfficeHoursSlots(slots) {
  return (Array.isArray(slots) ? slots : []).filter((slot) => slot.slotType === 'office-hours');
}

function mapPublicSlotToEvent(slot, currentUserId) {
  const bookedById = getBookedById(slot);
  const isMine = Boolean(bookedById && String(bookedById) === String(currentUserId));
  const isBooked = Boolean(bookedById);

  return {
    id: getItemId(slot),
    title: slot.title,
    startAt: buildDateTime(slot.date, slot.startTime),
    endAt: buildDateTime(slot.date, slot.endTime),
    description: slot.description || '',
    ownerName: slot.owner?.name || '',
    ownerEmail: slot.owner?.email || '',
    isBooked,
    isMine,
    statusLabel: isMine ? 'Reserved' : isBooked ? 'Booked' : 'Open',
    note: isMine
      ? 'You already reserved this slot.'
      : isBooked
        ? 'This slot is already reserved.'
        : 'Open for booking.'
  };
}

function StudentOwnersPage() {
  const { currentUser } = useSession();
  const isStudent = currentUser.role === 'user';
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

  const loadOwners = async () => {
    if (!isStudent) {
      return;
    }

    setLoadingOwners(true);

    try {
      const data = await apiRequest('/slots/public/owners');
      const nextOwners = Array.isArray(data) ? data : [];
      const officeHourOwners = (await Promise.all(
        nextOwners.map(async (owner) => {
          try {
            const ownerData = await apiRequest(`/slots/public/owner/${getItemId(owner)}/slots`);
            return filterOfficeHoursSlots(ownerData.slots).length ? owner : null;
          } catch (ownerError) {
            return null;
          }
        })
      )).filter(Boolean);

      setOwners(officeHourOwners);
      setSelectedOwnerId((currentValue) => {
        if (currentValue && officeHourOwners.some((owner) => getItemId(owner) === currentValue)) {
          return currentValue;
        }

        return officeHourOwners[0] ? getItemId(officeHourOwners[0]) : '';
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
  const openSlotCount = events.filter((event) => !event.isBooked).length;
  const reservedSlotCount = events.length - openSlotCount;

  const scheduleHeading = selectedDayKey
    ? `Office hours on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : selectedOwner
      ? `${selectedOwner.name}'s office hours`
      : 'Office hours';

  const handleBookSlot = async (slotId) => {
    setFeedback('');
    setBookingSlotId(slotId);

    try {
      await apiRequest(`/slots/${slotId}/book`, 'POST');
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
        <p className="eyebrow">Type 3 booking</p>
        <h1>Reserve office hours.</h1>
        <p className="dashboard-copy">
          Choose an owner, review the published office-hour schedule, and reserve an open time.
        </p>
      </section>

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
            <p>Checking which owners have published office hours.</p>
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
              <p>Try another name or clear the search to browse all owners with office hours.</p>
              <button className="text-link dashboard-show-all" onClick={() => setOwnerSearch('')} type="button">
                Clear search
              </button>
            </div>
          )
        ) : (
          <div className="dashboard-empty-state">
            <h3>No office hours available</h3>
            <p>Owners have not published any active office-hour slots yet.</p>
          </div>
        )}
      </section>

      {selectedOwner ? (
        <section className="dashboard-card owner-summary-card">
          <div>
            <p className="eyebrow">Selected owner</p>
            <h2>{selectedOwner.name}</h2>
            <p className="dashboard-copy">{selectedOwner.email}</p>
          </div>

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
        </section>
      ) : null}

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

          {feedback ? <div className="auth-notice">{feedback}</div> : null}

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
                      <article className="dashboard-event-row student-owner-event-row" key={event.id}>
                        <div className="dashboard-event-time">
                          <strong>{formatTimeRange(event.startAt, event.endAt)}</strong>
                          <span>{event.statusLabel}</span>
                        </div>

                        <div className="dashboard-event-main">
                          <div className="dashboard-event-head">
                            <h3>{event.title}</h3>
                            <span className="dashboard-badge">{event.statusLabel}</span>
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
                  : 'Select an owner with published office hours to start booking.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default StudentOwnersPage;
