import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../api/api';
import PageHeader from '../components/PageHeader';
import ScheduleCalendar from '../components/ScheduleCalendar';
import SchedulePanel from '../components/SchedulePanel';
import { useFeedback } from '../context/FeedbackContext';
import { useSession } from '../context/SessionContext';
import { createMailtoAction } from '../utils/bookings';
import {
  buildDateTime,
  formatLongDate,
  getDatePart,
  getDayKey,
  groupItemsByDay,
  parseDayKey
} from '../utils/date';
import {
  createEmailAction,
  getRequestId,
  getRequestPerson,
  normalizeStatus
} from '../components/bookings/type1/requestUtils';
import OwnerGroupMeetingPanel from '../components/bookings/type2/OwnerGroupMeetingPanel';
import BookingTypeSelector from '../components/bookings/shared/BookingTypeSelector';
import MeetingRequestsPanel from '../components/bookings/type1/MeetingRequestsPanel';
import OfficeHoursForm from '../components/bookings/type3/OfficeHoursForm';
import {
  createInitialOfficeHoursForm,
  createTimeOption
} from '../components/bookings/type3/officeHoursConfig';
import {
  buildOfficeHoursPayload,
  countOfficeHourSlots,
  countSlotsBySeries,
  countValidTimeBlocks,
  filterOfficeHoursSlots,
  getCreateValidationMessage,
  getPreviewSummary,
  getSelectedBookingType,
  getSeriesEndDate,
  mapSlotToEvent,
  sortTimeOptions
} from '../components/bookings/type3/officeHoursUtils';

//Stalbek Ulanbek uulu 261102435

function OwnerAvailabilityPage() {
  const { currentUser } = useSession();
  const { confirm, notify } = useFeedback();
  const isOwner = currentUser?.role === 'owner';
  const [selectedBookingTypeId, setSelectedBookingTypeId] = useState('type-3');
  const [scheduleMode, setScheduleMode] = useState('recurring');
  const [officeHoursForm, setOfficeHoursForm] = useState(() => createInitialOfficeHoursForm());
  const [timeOptions, setTimeOptions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(isOwner);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(isOwner);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState('');
  const [actingRequestId, setActingRequestId] = useState('');
  const [formFeedback, setFormFeedback] = useState('');
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [scheduleContentMaxHeight, setScheduleContentMaxHeight] = useState(0);
  const [hasOverflowingSchedule, setHasOverflowingSchedule] = useState(false);
  const calendarCardRef = useRef(null);
  const scheduleCardRef = useRef(null);
  const scheduleContentRef = useRef(null);

  const loadSlots = useCallback(async () => {
    if (!isOwner) {
      return;
    }

    setLoadingSlots(true);

    try {
      const data = await apiRequest('/slots/office-hours/mine');
      setSlots(filterOfficeHoursSlots(data));
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [isOwner, notify]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const loadRequests = useCallback(async () => {
    if (!isOwner) {
      return;
    }

    setLoadingRequests(true);

    try {
      const data = await apiRequest('/meetings/requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [isOwner, notify]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const selectedBookingType = getSelectedBookingType(selectedBookingTypeId);
  const isRecurring = scheduleMode === 'recurring';

  const officeHourEvents = useMemo(() => slots.map(mapSlotToEvent), [slots]);
  const requestEvents = useMemo(() => requests.map((request) => {
    const requestId = getRequestId(request);
    const student = getRequestPerson(request, 'owner');
    const dateKey = getDatePart(request.preferredDate);
    const startAt = buildDateTime(dateKey, request.preferredStartTime);
    const endAt = buildDateTime(dateKey, request.preferredEndTime);
    const requestStatus = request.status || 'pending';
    const startDate = new Date(startAt);
    const isPast = Number.isFinite(startDate.getTime()) && startDate <= new Date();

    return {
      id: requestId,
      bookingType: 'type-1',
      title: `From ${student.name}`,
      startAt,
      endAt,
      studentEmail: student.email,
      studentName: student.name,
      note: request.message || 'No message added.',
      requestStatus,
      statusLabel: normalizeStatus(requestStatus),
      isPast
    };
  }), [requests]);
  const seriesCountByGroup = useMemo(() => countSlotsBySeries(slots), [slots]);
  const todayDayKey = getDayKey(new Date());
  const scheduleEvents = selectedBookingType.id === 'type-1' ? requestEvents : officeHourEvents;
  const upcomingEvents = useMemo(
    () => scheduleEvents.filter((event) => getDayKey(event.startAt) >= todayDayKey),
    [scheduleEvents, todayDayKey]
  );

  const visibleEvents = useMemo(() => (
    selectedDayKey
      ? scheduleEvents.filter((event) => getDayKey(event.startAt) === selectedDayKey)
      : upcomingEvents
  ), [scheduleEvents, selectedDayKey, upcomingEvents]);

  const groupedEvents = useMemo(() => groupItemsByDay(visibleEvents), [visibleEvents]);

  const scheduleHeading = selectedDayKey
    ? `${selectedBookingType.id === 'type-1' ? 'Meetings' : 'Office hours'} on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : selectedBookingType.id === 'type-1'
      ? 'All meeting requests'
      : 'All office hours';
  const emptyTitle = selectedDayKey
    ? selectedBookingType.id === 'type-1'
      ? 'No meetings on this day'
      : 'No OH slots on this day'
    : scheduleEvents.length
      ? selectedBookingType.id === 'type-1'
        ? 'No upcoming meeting requests'
        : 'No upcoming OH slots'
      : selectedBookingType.id === 'type-1'
        ? 'No meeting requests yet'
        : 'No OH slots yet';
  const emptyCopy = selectedDayKey
    ? 'Choose another day or return to the full list.'
    : scheduleEvents.length
      ? selectedBookingType.id === 'type-1'
        ? 'Click a past day on the calendar to view older meeting requests.'
        : 'Click a past day on the calendar to view older OH slots.'
      : selectedBookingType.id === 'type-1'
        ? 'New meeting requests will appear here.'
        : 'Create OH slots to begin.';

  const seriesEndDate = useMemo(
    () => getSeriesEndDate(officeHoursForm.startDate, officeHoursForm.recurringWeeks),
    [officeHoursForm.startDate, officeHoursForm.recurringWeeks]
  );

  const slotPreviewCount = useMemo(() => {
    if (isRecurring) {
      return countOfficeHourSlots(
        officeHoursForm.startDate,
        seriesEndDate,
        officeHoursForm.recurringWeeks,
        timeOptions
      );
    }

    return officeHoursForm.singleDate ? countValidTimeBlocks(timeOptions) : 0;
  }, [
    isRecurring,
    officeHoursForm.recurringWeeks,
    officeHoursForm.singleDate,
    officeHoursForm.startDate,
    seriesEndDate,
    timeOptions
  ]);

  const previewSummary = useMemo(
    () => getPreviewSummary(scheduleMode, officeHoursForm, seriesEndDate),
    [scheduleMode, officeHoursForm, seriesEndDate]
  );

  const sortedTimeOptions = useMemo(
    () => sortTimeOptions(timeOptions, scheduleMode),
    [scheduleMode, timeOptions]
  );

  useEffect(() => {
    setShowAllSchedule(false);
  }, [selectedDayKey, selectedBookingTypeId]);

  useEffect(() => {
    if (selectedBookingType.id !== 'type-1' && selectedBookingType.id !== 'type-3') {
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
    groupedEvents.length,
    loadingSlots,
    selectedBookingType.id,
    selectedDayKey,
    showAllSchedule
  ]);

  const handleOfficeHoursFieldChange = (name, value) => {
    setOfficeHoursForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleTimeOptionChange = (index, name, value) => {
    setTimeOptions((currentOptions) => currentOptions.map((option, optionIndex) => (
      optionIndex === index
        ? { ...option, [name]: value }
        : option
    )));
  };

  const handleScheduleModeChange = (nextMode) => {
    setScheduleMode(nextMode);
    setTimeOptions([]);
    setFormFeedback('');
  };

  const addTimeOption = (dayOfWeek = '') => {
    setTimeOptions((currentOptions) => [...currentOptions, createTimeOption(dayOfWeek)]);
  };

  const removeTimeOption = (index) => {
    setTimeOptions((currentOptions) => currentOptions.filter((option, optionIndex) => optionIndex !== index));
  };

  const handleCreateOfficeHours = async (event) => {
    event.preventDefault();
    setFormFeedback('');

    const validationMessage = getCreateValidationMessage(scheduleMode, officeHoursForm, timeOptions, slotPreviewCount);

    if (validationMessage) {
      setFormFeedback(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const data = await apiRequest(
        '/slots/office-hours/create',
        'POST',
        buildOfficeHoursPayload(scheduleMode, officeHoursForm, timeOptions, seriesEndDate)
      );

      setOfficeHoursForm((currentValues) => ({
        ...currentValues,
        title: '',
        description: ''
      }));
      setTimeOptions([]);
      await loadSlots();
      notify({
        message: `Created ${data.slotsCreated || slotPreviewCount} office-hour slots.`,
        tone: 'success'
      });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const shouldDelete = await confirm({
      confirmLabel: 'Delete slot',
      message: 'This office-hour slot will be removed.',
      title: 'Delete this OH slot?'
    });

    if (!shouldDelete) {
      return;
    }

    setDeletingKey(`slot:${slotId}`);

    try {
      const data = await apiRequest(`/slots/${slotId}`, 'DELETE');
      const notifyAction = createMailtoAction(data.notifyEmail, 'Email student');

      await loadSlots();
      notify({
        actions: notifyAction ? [notifyAction] : [],
        message: 'Slot deleted.',
        tone: 'success'
      });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setDeletingKey('');
    }
  };

  const handleDeleteSeries = async (recurringGroupId) => {
    const slotsInSeries = slots.filter((slot) => slot.recurringGroupId === recurringGroupId);

    if (slotsInSeries.length < 2) {
      notify({
        message: 'This office-hour item does not have a linked series to delete.',
        tone: 'error'
      });
      return;
    }

    const shouldDelete = await confirm({
      confirmLabel: 'Delete series',
      message: `${slotsInSeries.length} office-hour slots will be removed.`,
      title: 'Delete this full series?'
    });

    if (!shouldDelete) {
      return;
    }

    setDeletingKey(`series:${recurringGroupId}`);

    let deletedCount = 0;
    const nextNoticeActions = [];

    try {
      for (const slot of slotsInSeries) {
        const data = await apiRequest(`/slots/${slot._id}`, 'DELETE');
        const notifyAction = createMailtoAction(data.notifyEmail, `Email student ${nextNoticeActions.length + 1}`);

        if (notifyAction) {
          nextNoticeActions.push(notifyAction);
        }

        deletedCount += 1;
      }

      await loadSlots();
      notify({
        actions: nextNoticeActions,
        message: `Deleted ${deletedCount} office-hour slots from this series.`,
        tone: 'success'
      });
    } catch (error) {
      notify({
        actions: nextNoticeActions,
        message: deletedCount
          ? `Deleted ${deletedCount} slot${deletedCount === 1 ? '' : 's'} before the series delete stopped. ${error.message}`
          : error.message,
        tone: 'error'
      });
      await loadSlots();
    } finally {
      setDeletingKey('');
    }
  };

  const handleRequestAction = async (requestId, action) => {
    if (action === 'decline') {
      const shouldDecline = await confirm({
        confirmLabel: 'Decline request',
        message: 'The student will need to send a new request if they still want this meeting.',
        title: 'Decline this request?'
      });

      if (!shouldDecline) {
        return;
      }
    }

    setActingRequestId(requestId);

    try {
      const data = await apiRequest(`/meetings/request/${requestId}/${action}`, 'PATCH');
      const notifyAction = createEmailAction(
        data.notifyEmail,
        'Email student',
        action === 'accept' ? 'Meeting request accepted' : 'Meeting request declined'
      );

      await loadRequests();
      notify({
        actions: notifyAction ? [notifyAction] : [],
        message: action === 'accept' ? 'Request accepted and booked.' : 'Request declined.',
        tone: 'success'
      });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setActingRequestId('');
    }
  };

  if (!isOwner) {
    return (
      <div className="dashboard-page availability-page">
        <PageHeader
          description="Owners only."
          eyebrow="Availability"
          title="Owner account required."
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page availability-page">
      <PageHeader
        eyebrow="Owner's bookings"
        title="Manage your slots"
      />

      <BookingTypeSelector
        onSelectBookingType={setSelectedBookingTypeId}
        selectedBookingTypeId={selectedBookingTypeId}
      />

      {selectedBookingType.id === 'type-1' ? (
        <MeetingRequestsPanel
          actingRequestId={actingRequestId}
          loading={loadingRequests}
          onAccept={(requestId) => handleRequestAction(requestId, 'accept')}
          onDecline={(requestId) => handleRequestAction(requestId, 'decline')}
          requests={requests}
        />
      ) : selectedBookingType.id === 'type-3' ? (
        <OfficeHoursForm
          feedback={formFeedback}
          officeHoursForm={officeHoursForm}
          onAddTimeOption={addTimeOption}
          onFieldChange={handleOfficeHoursFieldChange}
          onModeChange={handleScheduleModeChange}
          onRemoveTimeOption={removeTimeOption}
          onSubmit={handleCreateOfficeHours}
          onTimeOptionChange={handleTimeOptionChange}
          previewSummary={previewSummary}
          saving={saving}
          scheduleMode={scheduleMode}
          seriesEndDate={seriesEndDate}
          slotPreviewCount={slotPreviewCount}
          sortedTimeOptions={sortedTimeOptions}
          timeOptions={timeOptions}
        />
      ) : (
        <OwnerGroupMeetingPanel />
      )}

      {selectedBookingType.id === 'type-1' || selectedBookingType.id === 'type-3' ? (
        <div className="dashboard-layout">
          <div ref={calendarCardRef}>
            <ScheduleCalendar
              items={scheduleEvents}
              onDaySelect={setSelectedDayKey}
              selectedDayKey={selectedDayKey}
            />
          </div>

          <SchedulePanel
            actionsClassName="availability-actions"
            collapsed={!showAllSchedule && hasOverflowingSchedule}
            contentRef={scheduleContentRef}
            contentStyle={!showAllSchedule && hasOverflowingSchedule && scheduleContentMaxHeight
              ? { maxHeight: `${scheduleContentMaxHeight}px` }
              : undefined}
            emptyCopy={emptyCopy}
            emptyTitle={emptyTitle}
            groupedEvents={groupedEvents}
            heading={scheduleHeading}
            loading={selectedBookingType.id === 'type-1' ? loadingRequests : loadingSlots}
            loadingCopy={selectedBookingType.id === 'type-1'
              ? 'Checking your meeting-request schedule.'
              : 'Checking your office-hour schedule.'}
            onClearSelectedDay={() => setSelectedDayKey('')}
            onToggleExpanded={() => setShowAllSchedule((currentValue) => !currentValue)}
            panelRef={scheduleCardRef}
            renderActions={(event) => {
              if (selectedBookingType.id === 'type-1') {
                const isPending = event.requestStatus === 'pending';

                return (
                  <>
                    {event.studentEmail ? (
                      <a className="text-link" href={`mailto:${event.studentEmail}`}>
                        Email student
                      </a>
                    ) : null}

                    {isPending ? (
                      <>
                        <button
                          className="text-link"
                          disabled={actingRequestId === event.id}
                          onClick={() => handleRequestAction(event.id, 'accept')}
                          type="button"
                        >
                          {actingRequestId === event.id ? 'Working' : 'Accept'}
                        </button>

                        <button
                          className="text-link booking-cancel-button"
                          disabled={actingRequestId === event.id}
                          onClick={() => handleRequestAction(event.id, 'decline')}
                          type="button"
                        >
                          Decline
                        </button>
                      </>
                    ) : null}
                  </>
                );
              }

              const seriesCount = seriesCountByGroup.get(event.recurringGroupId) || 0;
              const hasSeries = Boolean(event.recurringGroupId && seriesCount > 1);
              const isDeletingSlot = deletingKey === `slot:${event.id}`;
              const isDeletingSeries = deletingKey === `series:${event.recurringGroupId}`;

              return (
                <>
                  {event.bookedEmail ? (
                    <a className="text-link" href={`mailto:${event.bookedEmail}`}>
                      Email student
                    </a>
                  ) : null}

                  <button
                    className="text-link availability-delete"
                    disabled={isDeletingSlot || isDeletingSeries}
                    onClick={() => handleDeleteSlot(event.id)}
                    type="button"
                  >
                    {isDeletingSlot ? 'Deleting' : hasSeries ? 'Delete occurrence' : 'Delete'}
                  </button>

                  {hasSeries ? (
                    <button
                      className="text-link availability-delete-series"
                      disabled={isDeletingSeries || isDeletingSlot}
                      onClick={() => handleDeleteSeries(event.recurringGroupId)}
                      type="button"
                    >
                      {isDeletingSeries ? 'Deleting series' : 'Delete series'}
                    </button>
                  ) : null}
                </>
              );
            }}
            renderBody={(event) => (
              selectedBookingType.id === 'type-1' ? (
                <>
                  <div className="dashboard-event-head">
                    <h3>{event.title}</h3>
                    <span className={`dashboard-badge${event.requestStatus === 'pending' ? '' : ' dashboard-badge-muted'}`}>
                      {event.statusLabel}
                    </span>
                  </div>

                  {event.studentEmail ? <p>{event.studentEmail}</p> : null}
                  <p>{event.note}</p>
                </>
              ) : (
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
              )
            )}
            rowClassName={(event) => `availability-event-row${event.isPast ? ' dashboard-event-row-past' : ''}`}
            selectedDayKey={selectedDayKey}
            showOverflowToggle={hasOverflowingSchedule}
            showOverflowToggleLabel={showAllSchedule ? 'Show less' : 'Show more'}
          />
        </div>
      ) : null}
    </div>
  );
}

export default OwnerAvailabilityPage;
