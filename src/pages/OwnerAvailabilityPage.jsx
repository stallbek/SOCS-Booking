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
    status: 'Next',
    copy: 'Students ask for a meeting time, and owners accept or decline the request.'
  },
  {
    id: 'type-2',
    label: 'Type 2',
    title: 'Group meeting',
    status: 'Next',
    copy: 'Owners collect availability from invited students before choosing the shared time.'
  },
  {
    id: 'type-3',
    label: 'Type 3',
    title: 'Office hours',
    status: 'Active',
    copy: 'Owners define a weekly pattern and repeat it for the weeks students can reserve.'
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
  recurringWeeks: '5',
  description: ''
};

const defaultTimeOption = {
  dayOfWeek: '1',
  startTime: '10:00',
  endTime: '10:30'
};

function parseDateInput(value) {
  return new Date(`${value}T12:00:00`);
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

function mapSlotToEvent(slot) {
  const bookedName = slot.bookedByName || slot.bookedBy?.name || '';
  const bookedEmail = slot.bookedByEmail || slot.bookedBy?.email || '';
  const isBooked = Boolean(bookedName || bookedEmail || slot.bookedBy);
  const statusLabel = isBooked ? 'Booked' : slot.status === 'active' ? 'Active' : 'Private';

  return {
    id: slot._id,
    title: slot.title,
    startAt: buildDateTime(slot.date, slot.startTime),
    endAt: buildDateTime(slot.date, slot.endTime),
    description: slot.description || '',
    status: slot.status,
    statusLabel,
    isBooked,
    bookedName,
    bookedEmail,
    inviteCode: slot.inviteCode || '',
    note: isBooked
      ? `Reserved by ${bookedName || bookedEmail}`
      : slot.status === 'active'
        ? 'Visible to students'
        : 'Private until activated'
  };
}

function OwnerAvailabilityPage() {
  const { currentUser } = useSession();
  const isOwner = currentUser.role === 'owner';
  const [officeHoursForm, setOfficeHoursForm] = useState(defaultOfficeHoursForm);
  const [timeOptions, setTimeOptions] = useState([defaultTimeOption]);
  const [slots, setSlots] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(isOwner);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [inviteLinks, setInviteLinks] = useState({});

  const loadSlots = async () => {
    if (!isOwner) return;

    setLoadingSlots(true);

    try {
      const data = await apiRequest('/slots/mine/details');
      setSlots(Array.isArray(data) ? data : []);
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

  const visibleEvents = selectedDayKey
    ? events.filter((event) => getDayKey(event.startAt) === selectedDayKey)
    : events;

  const groupedEvents = groupItemsByDay(visibleEvents);

  const scheduleHeading = selectedDayKey
    ? `Availability on ${formatLongDate(parseDayKey(selectedDayKey))}`
    : 'All availability';

  const seriesEndDate = useMemo(
    () => getSeriesEndDate(officeHoursForm.startDate, officeHoursForm.recurringWeeks),
    [officeHoursForm.startDate, officeHoursForm.recurringWeeks]
  );

  const slotPreviewCount = useMemo(
    () => countOfficeHourSlots(
      officeHoursForm.startDate,
      seriesEndDate,
      officeHoursForm.recurringWeeks,
      timeOptions
    ),
    [officeHoursForm.startDate, seriesEndDate, officeHoursForm.recurringWeeks, timeOptions]
  );

  const sortedTimeOptions = useMemo(
    () => timeOptions
      .map((option, index) => ({ ...option, index }))
      .sort((firstOption, secondOption) => (
        getWeekdayRank(firstOption.dayOfWeek) - getWeekdayRank(secondOption.dayOfWeek)
        || firstOption.startTime.localeCompare(secondOption.startTime)
      )),
    [timeOptions]
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

  const addTimeOption = (dayOfWeek = defaultTimeOption.dayOfWeek) => {
    setTimeOptions((currentOptions) => [...currentOptions, { ...defaultTimeOption, dayOfWeek }]);
  };

  const removeTimeOption = (index) => {
    setTimeOptions((currentOptions) => currentOptions.filter((option, optionIndex) => optionIndex !== index));
  };

  const handleCreateOfficeHours = async (event) => {
    event.preventDefault();
    setFeedback('');

    if (!officeHoursForm.title.trim() || !officeHoursForm.startDate) {
      setFeedback('Add a title and first week date.');
      return;
    }

    const recurringWeeks = Number(officeHoursForm.recurringWeeks);

    if (!Number.isFinite(recurringWeeks) || recurringWeeks < 1) {
      setFeedback('Add at least one repeating week.');
      return;
    }

    const hasInvalidTime = timeOptions.some((option) => !option.startTime || !option.endTime || option.startTime >= option.endTime);

    if (hasInvalidTime) {
      setFeedback('Each weekly block needs an end time after its start time.');
      return;
    }

    if (!slotPreviewCount) {
      setFeedback('The selected weekly pattern does not create any slots.');
      return;
    }

    setSaving(true);

    try {
      const data = await apiRequest('/slots/office-hours/create', 'POST', {
        title: officeHoursForm.title.trim(),
        description: officeHoursForm.description.trim(),
        startDate: officeHoursForm.startDate,
        endDate: seriesEndDate,
        recurringWeeks,
        timeOptions: timeOptions.map((option) => ({
          dayOfWeek: Number(option.dayOfWeek),
          startTime: option.startTime,
          endTime: option.endTime
        }))
      });

      setOfficeHoursForm((currentValues) => ({
        ...currentValues,
        title: '',
        description: ''
      }));
      setFeedback(`Created ${data.slotsCreated || slotPreviewCount} office-hour slots.`);
      await loadSlots();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleActivateSlot = async (slotId) => {
    setFeedback('');

    try {
      await apiRequest(`/slots/${slotId}/activate`, 'PUT');
      setFeedback('Slot activated.');
      await loadSlots();
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const shouldDelete = window.confirm('Delete this availability slot?');

    if (!shouldDelete) return;

    setFeedback('');

    try {
      await apiRequest(`/slots/${slotId}`, 'DELETE');
      setInviteLinks((currentLinks) => {
        const nextLinks = { ...currentLinks };
        delete nextLinks[slotId];
        return nextLinks;
      });
      setFeedback('Slot deleted.');
      await loadSlots();
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const handleGenerateInviteLink = async (slotId) => {
    setFeedback('');

    try {
      const data = await apiRequest(`/slots/${slotId}/invite-link`, 'POST');
      const inviteLink = `${window.location.origin}${data.inviteLink}`;

      setInviteLinks((currentLinks) => ({
        ...currentLinks,
        [slotId]: inviteLink
      }));
      setFeedback('Invitation link generated.');
      await loadSlots();
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const handleCopyInviteLink = async (slotId) => {
    const inviteLink = inviteLinks[slotId];

    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setFeedback('Invitation link copied.');
    } catch (error) {
      setFeedback(inviteLink);
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
        <h1>Post appointment times.</h1>
        <p className="dashboard-copy">
          Define the weekly pattern once, then repeat it across the semester.
        </p>
      </section>

      <section className="booking-type-grid" aria-label="Booking types">
        {bookingTypes.map((type) => (
          <article className={`booking-type-card${type.id === 'type-3' ? ' booking-type-card-active' : ''}`} key={type.id}>
            <div className="booking-type-head">
              <span className="booking-type-label">{type.label}</span>
              <span className="dashboard-badge">{type.status}</span>
            </div>
            <h2>{type.title}</h2>
            <p>{type.copy}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-card availability-form-card">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">Type 3</p>
            <h2>Create recurring office hours</h2>
          </div>
          <span className="availability-form-note">Active when created</span>
        </div>

        <form className="office-hours-compose" onSubmit={handleCreateOfficeHours}>
          <div className="calendar-compose-top">
            <label className="form-field office-hours-title-field">
              <span>Office-hour series</span>
              <input
                name="title"
                onChange={handleOfficeHoursChange}
                placeholder="Add title"
                type="text"
                value={officeHoursForm.title}
              />
            </label>

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

            <label className="form-field">
              <span>Description</span>
              <textarea
                name="description"
                onChange={handleOfficeHoursChange}
                placeholder="Add room, topic, or booking note"
                rows="2"
                value={officeHoursForm.description}
              ></textarea>
            </label>
          </div>

          <div className="calendar-method-layout">
            <div className="weekly-pattern-panel">
              <div className="weekly-pattern-head">
                <div>
                  <p className="eyebrow">Weekly pattern</p>
                  <h3>Click a day or add a row.</h3>
                </div>

                <button className="button button-muted" onClick={() => addTimeOption()} type="button">
                  Add row
                </button>
              </div>

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

              <div className="calendar-block-list">
                {sortedTimeOptions.map((option) => (
                  <div className="calendar-block-row" key={`${option.dayOfWeek}-${option.index}`}>
                    <select
                      aria-label="Office hour day"
                      name="dayOfWeek"
                      onChange={(event) => handleTimeOptionChange(option.index, event)}
                      value={option.dayOfWeek}
                    >
                      {weekdayOptions.map((weekday) => (
                        <option key={weekday.value} value={weekday.value}>
                          {weekday.label}
                        </option>
                      ))}
                    </select>

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
                      disabled={timeOptions.length === 1}
                      onClick={() => removeTimeOption(option.index)}
                      type="button"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <aside className="office-hours-preview-card">
              <p className="eyebrow">Preview</p>
              <h3>{slotPreviewCount} bookable slots</h3>
              <p>
                {officeHoursForm.recurringWeeks || 0} week series
                {seriesEndDate ? ` ending ${formatLongDate(parseDayKey(seriesEndDate))}` : ''}
              </p>

              <div className="office-hours-preview-list">
                {sortedTimeOptions.map((option) => (
                  <div className="office-hours-preview-item" key={`preview-${option.dayOfWeek}-${option.index}`}>
                    <span>{getWeekdayLabel(option.dayOfWeek)}</span>
                    <strong>{option.startTime} - {option.endTime}</strong>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="office-hours-footer">
            {feedback ? <div className="auth-notice">{feedback}</div> : null}

            <button className="button button-primary availability-submit" disabled={saving} type="submit">
              {saving ? 'Saving' : 'Create office hours'}
            </button>
          </div>
        </form>
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
              <p>Checking your owner slots.</p>
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

                          {event.inviteCode || inviteLinks[event.id] ? (
                            <p className="availability-link-note">
                              Invite code: {event.inviteCode || 'new link generated'}
                            </p>
                          ) : null}

                          {inviteLinks[event.id] ? (
                            <button
                              className="availability-link-text"
                              onClick={() => handleCopyInviteLink(event.id)}
                              type="button"
                            >
                              {inviteLinks[event.id]}
                            </button>
                          ) : null}
                        </div>

                        <div className="dashboard-event-actions availability-actions">
                          {event.bookedEmail ? (
                            <a className="text-link" href={`mailto:${event.bookedEmail}`}>
                              Email student
                            </a>
                          ) : null}

                          {event.status !== 'active' ? (
                            <button className="text-link" onClick={() => handleActivateSlot(event.id)} type="button">
                              Activate
                            </button>
                          ) : (
                            <button className="text-link" onClick={() => handleGenerateInviteLink(event.id)} type="button">
                              Invite link
                            </button>
                          )}

                          <button className="text-link availability-delete" onClick={() => handleDeleteSlot(event.id)} type="button">
                            Delete
                          </button>
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
              <p>Create recurring office hours to begin.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default OwnerAvailabilityPage;
