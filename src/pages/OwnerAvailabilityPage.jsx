import { useEffect, useMemo, useState } from 'react';
import ScheduleCalendar from '../components/app/ScheduleCalendar';
import { apiRequest } from '../api/api';
import { useSession } from '../context/SessionContext';
import {
  buildDateTime,
  formatLongDate,
  formatTimeRange,
  getDayKey,
  groupItemsByDay,
  parseDayKey
} from '../utils/date';

const bookingTypes = [
  {
    id: 'type-1',
    label: 'Type 1',
    title: 'Request meeting',
    copy: 'Students ask for a meeting time, and owners accept or decline the request.'
  },
  {
    id: 'type-2',
    label: 'Type 2',
    title: 'Group meeting',
    copy: 'Owners collect availability from invited students before choosing the shared time.'
  },
  {
    id: 'type-3',
    label: 'Type 3',
    title: 'Office hours',
    copy: 'Owners can publish recurring availability or a single-date session for students to reserve.'
  }
];

const weekdayOptions = [
  { value: '1', label: 'Monday', shortLabel: 'Mon' },
  { value: '2', label: 'Tuesday', shortLabel: 'Tue' },
  { value: '3', label: 'Wednesday', shortLabel: 'Wed' },
  { value: '4', label: 'Thursday', shortLabel: 'Thu' },
  { value: '5', label: 'Friday', shortLabel: 'Fri' },
  { value: '6', label: 'Saturday', shortLabel: 'Sat' },
  { value: '0', label: 'Sunday', shortLabel: 'Sun' }
];

const defaultOfficeHoursForm = {
  title: '',
  startDate: getDayKey(new Date()),
  singleDate: getDayKey(new Date()),
  recurringWeeks: '5',
  description: ''
};

function createTimeOption(dayOfWeek = '') {
  return {
    dayOfWeek,
    startTime: '10:00',
    endTime: '10:30'
  };
}

function parseDateInput(value) {
  return new Date(`${value}T12:00:00`);
}

function getDateWeekdayValue(value) {
  return value ? String(parseDateInput(value).getDay()) : '';
}

function countValidTimeBlocks(timeOptions) {
  return timeOptions.filter((option) => option.startTime && option.endTime && option.startTime < option.endTime).length;
}

function getTimeOptionSortKey(option, scheduleMode) {
  if (scheduleMode === 'recurring') {
    return `${String(getWeekdayRank(option.dayOfWeek)).padStart(2, '0')}-${option.startTime}`;
  }

  return option.startTime;
}

function getPreviewLabel(option, scheduleMode, singleDate) {
  if (scheduleMode === 'recurring') {
    return getWeekdayLabel(option.dayOfWeek);
  }

  return singleDate ? formatLongDate(parseDayKey(singleDate)) : 'Choose a date';
}

function getEmptyPatternCopy(scheduleMode) {
  return scheduleMode === 'recurring'
    ? 'Choose a weekday or add a blank row, then set the times.'
    : 'Add one or more time blocks for the selected date.';
}

function getPatternHeading(scheduleMode, singleDate) {
  if (scheduleMode === 'recurring') {
    return 'Define the weekly schedule.';
  }

  return singleDate
    ? `Set the available times for ${formatLongDate(parseDayKey(singleDate))}`
    : 'Choose the session date.';
}

function getFooterButtonLabel(scheduleMode, saving) {
  if (saving) {
    return 'Saving';
  }

  return scheduleMode === 'recurring'
    ? 'Create recurring availability'
    : 'Create single-date availability';
}

function buildOfficeHoursPayload(scheduleMode, officeHoursForm, timeOptions, seriesEndDate) {
  if (scheduleMode === 'recurring') {
    return {
      title: officeHoursForm.title.trim(),
      description: officeHoursForm.description.trim(),
      startDate: officeHoursForm.startDate,
      endDate: seriesEndDate,
      recurringWeeks: Number(officeHoursForm.recurringWeeks),
      timeOptions: timeOptions.map((option) => ({
        dayOfWeek: Number(option.dayOfWeek),
        startTime: option.startTime,
        endTime: option.endTime
      }))
    };
  }

  const singleDayOfWeek = Number(getDateWeekdayValue(officeHoursForm.singleDate));

  return {
    title: officeHoursForm.title.trim(),
    description: officeHoursForm.description.trim(),
    startDate: officeHoursForm.singleDate,
    endDate: officeHoursForm.singleDate,
    recurringWeeks: 1,
    timeOptions: timeOptions.map((option) => ({
      dayOfWeek: singleDayOfWeek,
      startTime: option.startTime,
      endTime: option.endTime
    }))
  };
}

function getCreateValidationMessage(scheduleMode, officeHoursForm, timeOptions, slotPreviewCount) {
  if (!officeHoursForm.title.trim()) {
    return 'Add an office-hour title.';
  }

  if (scheduleMode === 'recurring' && !officeHoursForm.startDate) {
    return 'Choose the first week date.';
  }

  if (scheduleMode === 'single' && !officeHoursForm.singleDate) {
    return 'Choose the session date.';
  }

  if (!timeOptions.length) {
    return scheduleMode === 'recurring'
      ? 'Add at least one weekly block.'
      : 'Add at least one time block for the selected date.';
  }

  if (scheduleMode === 'recurring' && timeOptions.some((option) => !option.dayOfWeek)) {
    return 'Choose a weekday for every recurring block.';
  }

  if (scheduleMode === 'recurring') {
    const recurringWeeks = Number(officeHoursForm.recurringWeeks);

    if (!Number.isFinite(recurringWeeks) || recurringWeeks < 1) {
      return 'Add at least one repeating week.';
    }
  }

  if (timeOptions.some((option) => !option.startTime || !option.endTime || option.startTime >= option.endTime)) {
    return 'Each time block needs an end time after its start time.';
  }

  if (!slotPreviewCount) {
    return scheduleMode === 'recurring'
      ? 'The selected weekly pattern does not create any slots.'
      : 'The selected single-date setup does not create any slots.';
  }

  return '';
}

function getPreviewSummary(scheduleMode, officeHoursForm, seriesEndDate) {
  if (scheduleMode === 'recurring') {
    return `${officeHoursForm.recurringWeeks || 0} week schedule${seriesEndDate ? ` ending ${formatLongDate(parseDayKey(seriesEndDate))}` : ''}`;
  }

  return officeHoursForm.singleDate
    ? `Single-date availability on ${formatLongDate(parseDayKey(officeHoursForm.singleDate))}`
    : 'Choose a date for this availability.';
}

function getDescriptionPlaceholder(scheduleMode) {
  return scheduleMode === 'recurring'
    ? 'Add location, topic, or booking note'
    : 'Add location, topic, or booking note';
}

function getCreateHeading(scheduleMode) {
  return scheduleMode === 'recurring' ? 'Create recurring availability' : 'Create single-date availability';
}

function getSeriesLabel(scheduleMode) {
  return scheduleMode === 'recurring' ? 'Availability title' : 'Availability title';
}

function getTopCopy(scheduleMode) {
  return scheduleMode === 'recurring'
    ? 'Set a weekly schedule that repeats for the selected number of weeks.'
    : 'Set availability for one specific date.';
}

function getCustomDateSummary(value) {
  return value ? formatLongDate(parseDayKey(value)) : 'Choose a date';
}

function getBlockRowClassName(scheduleMode) {
  return scheduleMode === 'recurring' ? 'calendar-block-row' : 'calendar-block-row calendar-block-row-single';
}

function getTimeOptionKey(option) {
  return `${option.dayOfWeek}-${option.startTime}-${option.endTime}`;
}

function getRecurringAddRowLabel(scheduleMode) {
  return scheduleMode === 'recurring' ? 'Add time block' : 'Add time block';
}

function getModeCopy(scheduleMode) {
  return scheduleMode === 'recurring'
    ? 'Use this when the same availability repeats each week.'
    : 'Use this when availability is offered on one specific date.';
}

function addDaysToDateInput(value, days) {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + days);
  return getDayKey(date);
}

function getSeriesEndDate(startDate, recurringWeeks) {
  const weeks = Number(recurringWeeks);

  if (!startDate || !Number.isFinite(weeks) || weeks < 1) {
    return '';
  }

  return addDaysToDateInput(startDate, (weeks * 7) - 1);
}

function getWeekdayLabel(value) {
  return weekdayOptions.find((weekday) => weekday.value === String(value))?.label || 'Day';
}

function getWeekdayRank(value) {
  if (value === '' || value === null || value === undefined) {
    return 99;
  }

  const dayNumber = Number(value);
  return dayNumber === 0 ? 7 : dayNumber;
}

function countOfficeHourSlots(startDate, endDate, recurringWeeks, timeOptions) {
  if (!startDate || !endDate || !recurringWeeks || !timeOptions.length) {
    return 0;
  }

  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  const weeks = Number(recurringWeeks);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !Number.isFinite(weeks) || weeks < 1 || end < start) {
    return 0;
  }

  let count = 0;

  for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + weekIndex * 7);

    timeOptions.forEach((option) => {
      const optionDate = new Date(weekStart);
      const dayDiff = (Number(option.dayOfWeek) - optionDate.getDay() + 7) % 7;
      optionDate.setDate(optionDate.getDate() + dayDiff);

      if (option.startTime < option.endTime && optionDate <= end) {
        count += 1;
      }
    });
  }

  return count;
}

function filterOfficeHoursSlots(slots) {
  return (Array.isArray(slots) ? slots : []).filter((slot) => slot.slotType === 'office-hours');
}

function getSelectedBookingType(typeId) {
  return bookingTypes.find((type) => type.id === typeId) || bookingTypes[2];
}

function mapSlotToEvent(slot) {
  const bookedName = slot.bookedByName || slot.bookedBy?.name || '';
  const bookedEmail = slot.bookedByEmail || slot.bookedBy?.email || '';
  const isBooked = Boolean(bookedName || bookedEmail || slot.bookedBy);
  const statusLabel = isBooked ? 'Reserved' : 'Available';

  return {
    id: slot._id,
    title: slot.title,
    startAt: buildDateTime(slot.date, slot.startTime),
    endAt: buildDateTime(slot.date, slot.endTime),
    description: slot.description || '',
    statusLabel,
    isBooked,
    bookedName,
    bookedEmail,
    recurringGroupId: slot.recurringGroupId || '',
    note: isBooked
      ? `Reserved by ${bookedName || bookedEmail}`
      : 'Open for student booking.'
  };
}

function OwnerAvailabilityPage() {
  const { currentUser } = useSession();
  const isOwner = currentUser.role === 'owner';
  const [selectedBookingTypeId, setSelectedBookingTypeId] = useState('type-3');
  const [scheduleMode, setScheduleMode] = useState('recurring');
  const [officeHoursForm, setOfficeHoursForm] = useState(defaultOfficeHoursForm);
  const [timeOptions, setTimeOptions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(isOwner);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadSlots = async () => {
    if (!isOwner) return;

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

  const events = useMemo(() => slots.map(mapSlotToEvent), [slots]);
  const seriesCountByGroup = useMemo(() => {
    const counts = new Map();

    slots.forEach((slot) => {
      if (!slot.recurringGroupId) {
        return;
      }

      counts.set(slot.recurringGroupId, (counts.get(slot.recurringGroupId) || 0) + 1);
    });

    return counts;
  }, [slots]);

  const visibleEvents = selectedDayKey
    ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : events;

  const groupedEvents = groupItemsByDay(visibleEvents);

  const scheduleHeading = selectedDayKey
    ? `Office hours on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : 'All office hours';
  const selectedBookingType = getSelectedBookingType(selectedBookingTypeId);

  const isRecurring = scheduleMode === 'recurring';
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
    () => timeOptions
      .map((option, index) => ({ ...option, index }))
      .sort((firstOption, secondOption) => (
        getTimeOptionSortKey(firstOption, scheduleMode).localeCompare(getTimeOptionSortKey(secondOption, scheduleMode))
      )),
    [scheduleMode, timeOptions]
  );

  const handleOfficeHoursChange = (event) => {
    const { name, value } = event.target;

    setOfficeHoursForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleTimeOptionChange = (index, event) => {
    const { name, value } = event.target;

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

    if (!shouldDelete) return;

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

    if (!shouldDelete) return;

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
    }
    finally {
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

      <section className="booking-type-grid" aria-label="Booking types">
        {bookingTypes.map((type) => (
          <button
            aria-pressed={type.id === selectedBookingTypeId}
            className={`booking-type-card${type.id === selectedBookingTypeId ? ' booking-type-card-active' : ''}`}
            key={type.id}
            onClick={() => setSelectedBookingTypeId(type.id)}
            type="button"
          >
            <div className="booking-type-head">
              <span className="booking-type-label">{type.label}</span>
            </div>
            <h2>{type.title}</h2>
            <p>{type.copy}</p>
          </button>
        ))}
      </section>

      {selectedBookingType.id === 'type-3' ? (
        <section className="dashboard-card availability-form-card">
          <div className="dashboard-card-head">
            <div>
              <p className="eyebrow">Type 3</p>
              <h2>{getCreateHeading(scheduleMode)}</h2>
            </div>
            <span className="availability-form-note">Active when created</span>
          </div>

          <form className="office-hours-compose" onSubmit={handleCreateOfficeHours}>
            <div className="calendar-compose-top">
              <label className="form-field office-hours-title-field">
                <span>{getSeriesLabel(scheduleMode)}</span>
                <input
                  name="title"
                  onChange={handleOfficeHoursChange}
                  placeholder="Add title"
                  type="text"
                  value={officeHoursForm.title}
                />
              </label>

              <div className="office-hours-mode-toggle" aria-label="Office hour type">
              <button
                className={`office-hours-mode-button${isRecurring ? ' office-hours-mode-button-active' : ''}`}
                onClick={() => handleScheduleModeChange('recurring')}
                type="button"
              >
                <span>Recurring schedule</span>
                <strong>Repeats by week</strong>
              </button>

              <button
                className={`office-hours-mode-button${!isRecurring ? ' office-hours-mode-button-active' : ''}`}
                onClick={() => handleScheduleModeChange('single')}
                type="button"
              >
                <span>Single-date session</span>
                <strong>Specific date only</strong>
              </button>
            </div>

              <p className="office-hours-mode-copy">{getModeCopy(scheduleMode)}</p>

              {isRecurring ? (
                <div className="calendar-series-grid">
                  <label className="form-field">
                    <span>First week starts</span>
                    <input
                      name="startDate"
                      onChange={handleOfficeHoursChange}
                      type="date"
                      value={officeHoursForm.startDate}
                    />
                  </label>

                  <label className="form-field">
                    <span>Repeat for</span>
                    <div className="weeks-field">
                      <input
                        min="1"
                        name="recurringWeeks"
                        onChange={handleOfficeHoursChange}
                        type="number"
                        value={officeHoursForm.recurringWeeks}
                      />
                      <span>weeks</span>
                    </div>
                  </label>

                  <div className="series-summary" aria-live="polite">
                    <span>Runs through</span>
                    <strong>{seriesEndDate ? formatLongDate(parseDayKey(seriesEndDate)) : 'Choose a start date'}</strong>
                  </div>
                </div>
              ) : (
                <div className="calendar-series-grid calendar-series-grid-single">
                  <label className="form-field">
                    <span>Office-hour date</span>
                    <input
                      name="singleDate"
                      onChange={handleOfficeHoursChange}
                      type="date"
                      value={officeHoursForm.singleDate}
                    />
                  </label>

                  <div className="series-summary" aria-live="polite">
                    <span>Selected day</span>
                    <strong>{getCustomDateSummary(officeHoursForm.singleDate)}</strong>
                  </div>
                </div>
              )}

              <label className="form-field">
                <span>Description</span>
                <textarea
                  name="description"
                  onChange={handleOfficeHoursChange}
                  placeholder={getDescriptionPlaceholder(scheduleMode)}
                  rows="2"
                  value={officeHoursForm.description}
                ></textarea>
              </label>
            </div>

            <div className="calendar-method-layout">
              <div className="weekly-pattern-panel">
                <div className="weekly-pattern-head">
                  <div>
                    <h3>{getPatternHeading(scheduleMode, officeHoursForm.singleDate)}</h3>
                  </div>

                  <button className="button button-muted" onClick={() => addTimeOption()} type="button">
                    {getRecurringAddRowLabel(scheduleMode)}
                  </button>
                </div>

                <p className="office-hours-top-copy">{getTopCopy(scheduleMode)}</p>

                {isRecurring ? (
                  <div className="weekday-chip-row" aria-label="Add a weekly office-hour block">
                    {weekdayOptions.map((weekday) => {
                      const dayCount = timeOptions.filter((option) => option.dayOfWeek === weekday.value).length;

                      return (
                        <button
                          className={`weekday-chip${dayCount ? ' weekday-chip-active' : ''}`}
                          key={weekday.value}
                          onClick={() => addTimeOption(weekday.value)}
                          type="button"
                        >
                          <span>{weekday.shortLabel}</span>
                          <strong>{dayCount || '+'}</strong>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="calendar-block-list">
                  {sortedTimeOptions.length ? sortedTimeOptions.map((option) => (
                    <div className={getBlockRowClassName(scheduleMode)} key={`${getTimeOptionKey(option)}-${option.index}`}>
                      {isRecurring ? (
                        <select
                          aria-label="Office hour day"
                          name="dayOfWeek"
                          onChange={(event) => handleTimeOptionChange(option.index, event)}
                          value={option.dayOfWeek}
                        >
                          <option value="">Choose day</option>
                          {weekdayOptions.map((weekday) => (
                            <option key={weekday.value} value={weekday.value}>
                              {weekday.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="calendar-block-day-label">
                          <span>Day</span>
                          <strong>{getCustomDateSummary(officeHoursForm.singleDate)}</strong>
                        </div>
                      )}

                      <input
                        aria-label="Start time"
                        name="startTime"
                        onChange={(event) => handleTimeOptionChange(option.index, event)}
                        type="time"
                        value={option.startTime}
                      />

                      <span>to</span>

                      <input
                        aria-label="End time"
                        name="endTime"
                        onChange={(event) => handleTimeOptionChange(option.index, event)}
                        type="time"
                        value={option.endTime}
                      />

                      <button
                        aria-label="Remove office hour block"
                        className="calendar-block-remove"
                        onClick={() => removeTimeOption(option.index)}
                        type="button"
                      >
                        X
                      </button>
                    </div>
                  )) : (
                    <div className="dashboard-empty-state calendar-block-empty">
                      <h3>No time blocks yet</h3>
                      <p>{getEmptyPatternCopy(scheduleMode)}</p>
                    </div>
                  )}
                </div>
              </div>

              <aside className="office-hours-preview-card">
                <p className="eyebrow">Preview</p>
                <h3>{slotPreviewCount} bookable slots</h3>
                <p>{previewSummary}</p>

                <div className="office-hours-preview-list">
                  {sortedTimeOptions.map((option) => (
                    <div className="office-hours-preview-item" key={`preview-${getTimeOptionKey(option)}-${option.index}`}>
                      <span>{getPreviewLabel(option, scheduleMode, officeHoursForm.singleDate)}</span>
                      <strong>{option.startTime} - {option.endTime}</strong>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <div className="office-hours-footer">
              {feedback ? <div className="auth-notice">{feedback}</div> : null}

              <button className="button button-primary availability-submit" disabled={saving} type="submit">
                {getFooterButtonLabel(scheduleMode, saving)}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="dashboard-card booking-type-panel">
          <div className="dashboard-card-head">
            <div>
              <p className="eyebrow">{selectedBookingType.label}</p>
              <h2>{selectedBookingType.title}</h2>
            </div>
          </div>

          <div className="booking-type-panel-copy">
            <p>{selectedBookingType.copy}</p>
          </div>

          <div className="dashboard-empty-state booking-type-placeholder">
            <h3>This workflow is not implemented yet</h3>
            <p>
              Keep this button structure for the future Type 1 and Type 2 screens. Type 3 remains the active workflow for now.
            </p>
          </div>
        </section>
      )}

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

          {loadingSlots ? (
            <div className="dashboard-empty-state">
              <h3>Loading</h3>
              <p>Checking your office-hour schedule.</p>
            </div>
          ) : groupedEvents.length ? (
            <div className="dashboard-event-groups">
              {groupedEvents.map((group) => (
                <div className="dashboard-event-group" key={group.dayKey}>
                  {!selectedDayKey ? <h3 className="dashboard-group-label">{group.label}</h3> : null}

                  <div className="dashboard-event-list">
                    {group.items.map((event) => (
                      <article className="dashboard-event-row availability-event-row" key={event.id}>
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

                        <div className="dashboard-event-actions availability-actions">
                          {event.bookedEmail ? (
                            <a className="text-link" href={`mailto:${event.bookedEmail}`}>
                              Email student
                            </a>
                          ) : null}

                          <button
                            className="text-link availability-delete"
                            disabled={deletingKey === `slot:${event.id}` || deletingKey === `series:${event.recurringGroupId}`}
                            onClick={() => handleDeleteSlot(event.id)}
                            type="button"
                          >
                            {deletingKey === `slot:${event.id}` ? 'Deleting' : event.recurringGroupId && (seriesCountByGroup.get(event.recurringGroupId) || 0) > 1 ? 'Delete occurrence' : 'Delete'}
                          </button>

                          {event.recurringGroupId && (seriesCountByGroup.get(event.recurringGroupId) || 0) > 1 ? (
                            <button
                              className="text-link availability-delete-series"
                              disabled={deletingKey === `series:${event.recurringGroupId}` || deletingKey === `slot:${event.id}`}
                              onClick={() => handleDeleteSeries(event.recurringGroupId)}
                              type="button"
                            >
                              {deletingKey === `series:${event.recurringGroupId}` ? 'Deleting series' : 'Delete series'}
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <h3>No availability yet</h3>
              <p>Create office-hour availability to begin.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default OwnerAvailabilityPage;
