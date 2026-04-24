import { useEffect, useMemo, useRef, useState } from 'react';
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
    copy: 'Send a request.'
  },
  {
    id: 'type-2',
    label: 'Type 2',
    title: 'Group meeting',
    copy: 'Vote by code.'
  },
  {
    id: 'type-3',
    label: 'Type 3',
    title: 'Office hours',
    copy: 'Book a slot.'
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
  const isStudent = currentUser?.role === 'user';
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
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [scheduleContentMaxHeight, setScheduleContentMaxHeight] = useState(0);
  const [hasOverflowingSchedule, setHasOverflowingSchedule] = useState(false);
  const calendarCardRef = useRef(null);
  const scheduleCardRef = useRef(null);
  const scheduleContentRef = useRef(null);

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

        return '';
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
    const sortedOwners = [...owners].sort((firstOwner, secondOwner) => firstOwner.name.localeCompare(secondOwner.name));

    if (!query) {
      return [];
    }

    return sortedOwners.filter((owner) => {
        return owner.name.toLowerCase().includes(query) || owner.email.toLowerCase().includes(query);
      });
  }, [ownerSearch, owners]);

  const events = useMemo(
    () => ownerSlots.map((slot) => mapPublicSlotToEvent(slot, currentUser.id)),
    [ownerSlots, currentUser.id]
  );
  const todayDayKey = getDayKey(new Date());
  const upcomingEvents = useMemo(
    () => events.filter((event) => getDayKey(event.startAt) >= todayDayKey),
    [events, todayDayKey]
  );

  const visibleEvents = selectedDayKey
    ? upcomingEvents.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : upcomingEvents;

  const groupedEvents = groupItemsByDay(visibleEvents);

  const scheduleHeading = selectedDayKey
    ? `Office hours on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : selectedOwner
      ? `${selectedOwner.name}'s office hours`
      : 'Office hours';

  const isType1 = selectedBookingTypeId === 'type-1';
  const isType2 = selectedBookingTypeId === 'type-2';
  const isType3 = selectedBookingTypeId === 'type-3';
  const shouldShowOwnerDirectory = isType1 || isType3;

  const handleOwnerSearchChange = (value) => {
    setOwnerSearch(value);

    if (!value.trim()) {
      setSelectedDayKey('');
      setSelectedOwnerId('');
      setSelectedOwner(null);
      setOwnerSlots([]);
    }
  };

  useEffect(() => {
    setShowAllSchedule(false);
  }, [selectedOwnerId, selectedDayKey, selectedBookingTypeId]);

  useEffect(() => {
    if (!isType3 || !selectedOwner) {
      setScheduleContentMaxHeight(0);
      setHasOverflowingSchedule(false);
      return undefined;
    }

    const updateScheduleHeight = () => {
      const calendarHeight = calendarCardRef.current?.offsetHeight || 0;
      const scheduleHeight = scheduleCardRef.current?.offsetHeight || 0;
      const visibleContentHeight = scheduleContentRef.current?.offsetHeight || 0;
      const fullContentHeight = scheduleContentRef.current?.scrollHeight || 0;

      if (!calendarHeight || !scheduleHeight || !visibleContentHeight) {
        setScheduleContentMaxHeight(0);
        setHasOverflowingSchedule(false);
        return;
      }

      const reservedHeight = scheduleHeight - visibleContentHeight;
      const nextContentMaxHeight = Math.max(calendarHeight - reservedHeight, 0);

      setScheduleContentMaxHeight(nextContentMaxHeight);
      setHasOverflowingSchedule(fullContentHeight > nextContentMaxHeight + 4);
    };

    updateScheduleHeight();

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          updateScheduleHeight();
        });

    if (resizeObserver) {
      if (calendarCardRef.current) {
        resizeObserver.observe(calendarCardRef.current);
      }

      if (scheduleCardRef.current) {
        resizeObserver.observe(scheduleCardRef.current);
      }

      if (scheduleContentRef.current) {
        resizeObserver.observe(scheduleContentRef.current);
      }
    }

    window.addEventListener('resize', updateScheduleHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScheduleHeight);
    };
  }, [
    feedback,
    isType3,
    loadingSlots,
    noticeActions.length,
    selectedDayKey,
    selectedOwner,
    showAllSchedule,
    visibleEvents.length
  ]);

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
            Students book here.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page student-owners-page">
      <section className="dashboard-card dashboard-intro-card">
        <h1>Bookings</h1>
      </section>

      <BookingTypeSelector
        bookingTypeOptions={studentBookingTypes}
        label="Student booking types"
        onSelectBookingType={setSelectedBookingTypeId}
        selectedBookingTypeId={selectedBookingTypeId}
      />

      {shouldShowOwnerDirectory ? (
        <section className="dashboard-card owner-directory-card">
          {isType1 ? null : (
            <div className="dashboard-card-head">
              <div>
                <p className="eyebrow">Search owners</p>
                <h2>Owners</h2>
              </div>
            </div>
          )}

          <div className="owner-directory-toolbar">
            <label className="form-field owner-search-field">
              <span>{isType1 ? 'Search name' : 'Search owners'}</span>
              <input
                onChange={(event) => handleOwnerSearchChange(event.target.value)}
                placeholder="Search by name"
                type="search"
                value={ownerSearch}
              />
            </label>
          </div>

          {loadingOwners ? (
            <div className="dashboard-empty-state">
              <h3>Loading owners</h3>
              <p>Checking the owner directory.</p>
            </div>
          ) : !owners.length ? (
            <div className="dashboard-empty-state">
              <h3>No owners found</h3>
              <p>No owner accounts are available in the booking directory yet.</p>
            </div>
          ) : ownerSearch.trim() ? (
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
                <p>Try another name or clear the search.</p>
                <button className="text-link dashboard-show-all" onClick={() => handleOwnerSearchChange('')} type="button">
                  Clear search
                </button>
              </div>
            )
          ) : null}
        </section>
      ) : null}

      {isType1 ? <StudentMeetingRequestPanel selectedOwner={selectedOwner} /> : null}
      {isType2 ? <StudentGroupMeetingPanel /> : null}

      {isType3 ? (
        <div className="dashboard-layout">
          <div ref={calendarCardRef}>
            <ScheduleCalendar
              items={upcomingEvents}
              onDaySelect={setSelectedDayKey}
              selectedDayKey={selectedDayKey}
              title={selectedOwner ? `${selectedOwner.name}'s calendar` : undefined}
            />
          </div>

          <section className="dashboard-card events-card" ref={scheduleCardRef}>
            <div className="dashboard-card-head">
              <div>
                <p className="eyebrow">Schedule</p>
                <h2>{scheduleHeading}</h2>
              </div>

              <div className="dashboard-card-actions">
                {selectedDayKey ? (
                  <button
                    className="text-link dashboard-show-all"
                    onClick={() => setSelectedDayKey('')}
                    type="button"
                  >
                    Show all
                  </button>
                ) : null}

                {hasOverflowingSchedule ? (
                  <button
                    className="text-link dashboard-show-all"
                    onClick={() => setShowAllSchedule((currentValue) => !currentValue)}
                    type="button"
                  >
                    {showAllSchedule ? 'Show less' : 'Show more'}
                  </button>
                ) : null}
              </div>
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
              <div
                className={`schedule-card-content${!showAllSchedule && hasOverflowingSchedule ? ' schedule-card-content-collapsed' : ''}`}
                ref={scheduleContentRef}
                style={!showAllSchedule && hasOverflowingSchedule && scheduleContentMaxHeight
                  ? { maxHeight: `${scheduleContentMaxHeight}px` }
                  : undefined}
              >
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
                                  <Link className="text-link" to="/app/dashboard">
                                    View on dashboard
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
