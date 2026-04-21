import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/api';
import ScheduleCalendar from '../components/ScheduleCalendar';
import { useSession } from '../context/SessionContext';
import {
  formatLongDate,
  getDayKey,
  groupItemsByDay,
  parseDayKey
} from '../utils/date';
import AvailabilityEventsSection from '../components/ownerAvailability/AvailabilityEventsSection';
import BookingTypePlaceholder from '../components/ownerAvailability/BookingTypePlaceholder';
import BookingTypeSelector from '../components/ownerAvailability/BookingTypeSelector';
import OfficeHoursForm from '../components/ownerAvailability/OfficeHoursForm';
import {
  createInitialOfficeHoursForm,
  createTimeOption
} from '../components/ownerAvailability/constants';
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
} from '../components/ownerAvailability/utils';

function OwnerAvailabilityPage() {
  const { currentUser } = useSession();
  const isOwner = currentUser.role === 'owner';
  const [selectedBookingTypeId, setSelectedBookingTypeId] = useState('type-3');
  const [scheduleMode, setScheduleMode] = useState('recurring');
  const [officeHoursForm, setOfficeHoursForm] = useState(() => createInitialOfficeHoursForm());
  const [timeOptions, setTimeOptions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(isOwner);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadSlots = async () => {
    if (!isOwner) {
      return;
    }

    setLoadingSlots(true);

    try {
      const data = await apiRequest('/slots/office-hours/mine');
      setSlots(filterOfficeHoursSlots(data));
    } catch (error) {
      setFeedback(error.message);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [isOwner]);

  const selectedBookingType = getSelectedBookingType(selectedBookingTypeId);
  const isRecurring = scheduleMode === 'recurring';

  const events = useMemo(() => slots.map(mapSlotToEvent), [slots]);
  const seriesCountByGroup = useMemo(() => countSlotsBySeries(slots), [slots]);

  const visibleEvents = useMemo(() => (
    selectedDayKey
      ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
      : events
  ), [events, selectedDayKey]);

  const groupedEvents = useMemo(() => groupItemsByDay(visibleEvents), [visibleEvents]);

  const scheduleHeading = selectedDayKey
    ? `Office hours on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : 'All office hours';

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
    setFeedback('');
  };

  const addTimeOption = (dayOfWeek = '') => {
    setTimeOptions((currentOptions) => [...currentOptions, createTimeOption(dayOfWeek)]);
  };

  const removeTimeOption = (index) => {
    setTimeOptions((currentOptions) => currentOptions.filter((option, optionIndex) => optionIndex !== index));
  };

  const handleCreateOfficeHours = async (event) => {
    event.preventDefault();
    setFeedback('');

    const validationMessage = getCreateValidationMessage(scheduleMode, officeHoursForm, timeOptions, slotPreviewCount);

    if (validationMessage) {
      setFeedback(validationMessage);
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
      setFeedback(`Created ${data.slotsCreated || slotPreviewCount} office-hour slots.`);
      await loadSlots();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const shouldDelete = window.confirm('Delete this availability slot?');

    if (!shouldDelete) {
      return;
    }

    setFeedback('');
    setDeletingKey(`slot:${slotId}`);

    try {
      await apiRequest(`/slots/${slotId}`, 'DELETE');
      setFeedback('Slot deleted.');
      await loadSlots();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setDeletingKey('');
    }
  };

  const handleDeleteSeries = async (recurringGroupId) => {
    const slotsInSeries = slots.filter((slot) => slot.recurringGroupId === recurringGroupId);

    if (slotsInSeries.length < 2) {
      setFeedback('This office-hour item does not have a linked series to delete.');
      return;
    }

    const shouldDelete = window.confirm(`Delete this full series? ${slotsInSeries.length} office-hour slots will be removed.`);

    if (!shouldDelete) {
      return;
    }

    setFeedback('');
    setDeletingKey(`series:${recurringGroupId}`);

    let deletedCount = 0;

    try {
      for (const slot of slotsInSeries) {
        await apiRequest(`/slots/${slot._id}`, 'DELETE');
        deletedCount += 1;
      }

      setFeedback(`Deleted ${deletedCount} office-hour slots from this series.`);
      await loadSlots();
    } catch (error) {
      setFeedback(
        deletedCount
          ? `Deleted ${deletedCount} slot${deletedCount === 1 ? '' : 's'} before the series delete stopped. ${error.message}`
          : error.message
      );
      await loadSlots();
    } finally {
      setDeletingKey('');
    }
  };

  if (!isOwner) {
    return (
      <div className="dashboard-page availability-page">
        <section className="dashboard-card dashboard-intro-card">
          <p className="eyebrow">Availability</p>
          <h1>Owner account required.</h1>
          <p className="dashboard-copy">
            Students reserve active slots from owners. Availability management is for McGill owner accounts.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page availability-page">
      <section className="dashboard-card dashboard-intro-card">
        <p className="eyebrow">Owner availability</p>
        <h1>Manage availability.</h1>
        <p className="dashboard-copy">
          Create office-hour availability that students can reserve directly.
        </p>
      </section>

      <BookingTypeSelector
        onSelectBookingType={setSelectedBookingTypeId}
        selectedBookingTypeId={selectedBookingTypeId}
      />

      {selectedBookingType.id === 'type-3' ? (
        <OfficeHoursForm
          feedback={feedback}
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
        <BookingTypePlaceholder bookingType={selectedBookingType} />
      )}

      <div className="dashboard-layout">
        <ScheduleCalendar
          items={events}
          onDaySelect={setSelectedDayKey}
          selectedDayKey={selectedDayKey}
        />

        <AvailabilityEventsSection
          deletingKey={deletingKey}
          groupedEvents={groupedEvents}
          loadingSlots={loadingSlots}
          onClearSelectedDay={() => setSelectedDayKey('')}
          onDeleteSeries={handleDeleteSeries}
          onDeleteSlot={handleDeleteSlot}
          scheduleHeading={scheduleHeading}
          selectedDayKey={selectedDayKey}
          seriesCountByGroup={seriesCountByGroup}
        />
      </div>
    </div>
  );
}

export default OwnerAvailabilityPage;
