import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/api';
import OwnerDirectoryPanel from '../components/bookings/shared/OwnerDirectoryPanel';
import PageHeader from '../components/PageHeader';
import BookingTypeSelector from '../components/bookings/shared/BookingTypeSelector';
import SchedulePanel from '../components/SchedulePanel';
import StudentGroupMeetingPanel from '../components/bookings/type2/StudentGroupMeetingPanel';
import StudentMeetingRequestPanel from '../components/bookings/type1/StudentMeetingRequestPanel';
import ScheduleCalendar from '../components/ScheduleCalendar';
import { useFeedback } from '../context/FeedbackContext';
import { useSession } from '../context/SessionContext';
import {
  formatLongDate,
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
import { studentBookingTypes } from '../components/bookings/shared/bookingTypeOptions';

//Stalbek Ulanbek uulu 261102435

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
    ownerEmail: slot.owner?.email || '',
    ...slotState
  };
}

function StudentOwnersPage() {
  const { currentUser } = useSession();
  const { notify } = useFeedback();
  const [searchParams] = useSearchParams();
  const canUseBookingPage = Boolean(currentUser);
  const [selectedBookingTypeId, setSelectedBookingTypeId] = useState(() => (
    searchParams.get('groupCode') ? 'type-2' : 'type-1'
  ));
  const [owners, setOwners] = useState([]);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [loadingOwners, setLoadingOwners] = useState(canUseBookingPage);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlotId, setBookingSlotId] = useState('');
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [scheduleContentMaxHeight, setScheduleContentMaxHeight] = useState(0);
  const [hasOverflowingSchedule, setHasOverflowingSchedule] = useState(false);
  const calendarCardRef = useRef(null);
  const scheduleCardRef = useRef(null);
  const scheduleContentRef = useRef(null);

  const loadOwners = async () => {
    if (!canUseBookingPage) {
      return;
    }

    setLoadingOwners(true);

    try {
      console.log('Fetching /slots/public/owners');
      const data = await apiRequest('/slots/public/owners');
      console.log('RAW API response', data);
      const nextOwners = Array.isArray(data) ? data : [];
      console.log('Setting Owners', nextOwners.length, nextOwners[0]);
      setOwners(nextOwners);
      setSelectedOwnerId((currentValue) => {
        if (currentValue && nextOwners.some((owner) => (owner?._id || owner?.id || '') === currentValue)) {
          return currentValue;
        }

        return '';
      });
    } catch (error) {
      console.error('loadOwners error:', error);
      notify({ message: error.message, tone: 'error' });
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
      notify({ message: error.message, tone: 'error' });
      setSelectedOwner(null);
      setOwnerSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, [canUseBookingPage]);

  useEffect(() => {
    if (!canUseBookingPage) {
      return;
    }

    setSelectedDayKey('');
    loadOwnerSlots(selectedOwnerId);
  }, [canUseBookingPage, selectedOwnerId]);

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
    ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : upcomingEvents;

  const groupedEvents = groupItemsByDay(visibleEvents);

  const scheduleHeading = selectedDayKey
    ? `Office hours on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : selectedOwner
      ? `${selectedOwner.name}'s office hours`
      : 'Office hours';
  const emptyTitle = 'No slots found';
  const emptyCopy = selectedDayKey
    ? 'This owner has no office-hour slots on the selected day.'
    : 'This owner has no published office-hour slots right now.';

  const isType1 = selectedBookingTypeId === 'type-1';
  const isType2 = selectedBookingTypeId === 'type-2';
  const isType3 = selectedBookingTypeId === 'type-3';
  const shouldShowOwnerDirectory = isType1 || isType3;
  const hasSelectedOwner = Boolean(selectedOwner);

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
    isType3,
    loadingSlots,
    selectedDayKey,
    selectedOwner,
    showAllSchedule,
    visibleEvents.length
  ]);

  const handleBookSlot = async (slotId) => {
    setBookingSlotId(slotId);

    try {
      const data = await apiRequest(`/slots/${slotId}/book`, 'POST');
      const notifyAction = createMailtoAction(data.notifyOwnerEmail, 'Email owner');

      await loadOwnerSlots(selectedOwnerId);
      notify({
        actions: notifyAction ? [notifyAction] : [],
        message: 'Slot reserved.',
        tone: 'success'
      });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setBookingSlotId('');
    }
  };

  if (!canUseBookingPage) {
    return (
      <div className="dashboard-page student-owners-page">
        <PageHeader
          description="Signed-in users book here."
          eyebrow="Bookings"
          title="Account required."
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page student-owners-page">
      <PageHeader
        eyebrow="Bookings"
        title="Book a meeting"
      />

      <BookingTypeSelector
        bookingTypeOptions={studentBookingTypes}
        label="Student booking types"
        onSelectBookingType={setSelectedBookingTypeId}
        selectedBookingTypeId={selectedBookingTypeId}
      />

      {shouldShowOwnerDirectory ? (
        <OwnerDirectoryPanel
          filteredOwners={filteredOwners}
          loadingOwners={loadingOwners}
          onClearSearch={() => handleOwnerSearchChange('')}
          onSearchChange={handleOwnerSearchChange}
          onSelectOwner={setSelectedOwnerId}
          ownerSearch={ownerSearch}
          owners={owners}
          selectedOwnerId={selectedOwnerId}
        />
      ) : null}

      {isType1 && hasSelectedOwner ? <StudentMeetingRequestPanel selectedOwner={selectedOwner} /> : null}
      {isType2 ? <StudentGroupMeetingPanel /> : null}

      {isType3 && hasSelectedOwner ? (
        <div className="dashboard-layout">
          <div ref={calendarCardRef}>
            <ScheduleCalendar
              items={events}
              onDaySelect={setSelectedDayKey}
              selectedDayKey={selectedDayKey}
              title={selectedOwner ? `${selectedOwner.name}'s calendar` : undefined}
            />
          </div>

          <SchedulePanel
            actionsClassName="student-owner-actions"
            collapsed={!showAllSchedule && hasOverflowingSchedule}
            contentRef={scheduleContentRef}
            contentStyle={!showAllSchedule && hasOverflowingSchedule && scheduleContentMaxHeight
              ? { maxHeight: `${scheduleContentMaxHeight}px` }
              : undefined}
            emptyCopy={emptyCopy}
            emptyTitle={emptyTitle}
            groupedEvents={groupedEvents}
            heading={scheduleHeading}
            loading={loadingSlots}
            loadingCopy="Checking the selected owner's office-hour schedule."
            loadingTitle="Loading slots"
            onClearSelectedDay={() => setSelectedDayKey('')}
            onToggleExpanded={() => setShowAllSchedule((currentValue) => !currentValue)}
            panelRef={scheduleCardRef}
            renderActions={(event) => (
              <>
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
              </>
            )}
            renderBody={(event) => (
              <>
                <div className="dashboard-event-head">
                  <h3>{event.title}</h3>
                  <span className={`dashboard-badge${event.isPast ? ' dashboard-badge-muted' : ''}`}>
                    {event.statusLabel}
                  </span>
                </div>

                {event.description ? <p>{event.description}</p> : null}
                <p>{event.note}</p>
              </>
            )}
            rowClassName={(event) => `student-owner-event-row${event.isPast ? ' dashboard-event-row-past' : ''}`}
            selectedDayKey={selectedDayKey}
            showOverflowToggle={hasOverflowingSchedule}
            showOverflowToggleLabel={showAllSchedule ? 'Show less' : 'Show more'}
          />
        </div>
      ) : null}
    </div>
  );
}

export default StudentOwnersPage;
