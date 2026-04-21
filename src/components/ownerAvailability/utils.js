import { bookingTypes, weekdayOptions } from './constants';
import {
  buildDateTime,
  formatLongDate,
  getDayKey,
  parseDayKey
} from '../../utils/date';

function parseDateInput(value) {
  return new Date(`${value}T12:00:00`);
}

function getDateWeekdayValue(value) {
  return value ? String(parseDateInput(value).getDay()) : '';
}

function addDaysToDateInput(value, days) {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + days);
  return getDayKey(date);
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

function getTimeOptionSortKey(option, scheduleMode) {
  if (scheduleMode === 'recurring') {
    return `${String(getWeekdayRank(option.dayOfWeek)).padStart(2, '0')}-${option.startTime}`;
  }

  return option.startTime;
}

export function getSelectedBookingType(typeId) {
  return bookingTypes.find((type) => type.id === typeId) || bookingTypes[2];
}

export function filterOfficeHoursSlots(slots) {
  return (Array.isArray(slots) ? slots : []).filter((slot) => slot.slotType === 'office-hours');
}

export function mapSlotToEvent(slot) {
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

export function countSlotsBySeries(slots) {
  const counts = new Map();

  slots.forEach((slot) => {
    if (!slot.recurringGroupId) {
      return;
    }

    counts.set(slot.recurringGroupId, (counts.get(slot.recurringGroupId) || 0) + 1);
  });

  return counts;
}

export function sortTimeOptions(timeOptions, scheduleMode) {
  return timeOptions
    .map((option, index) => ({ ...option, index }))
    .sort((firstOption, secondOption) => (
      getTimeOptionSortKey(firstOption, scheduleMode).localeCompare(getTimeOptionSortKey(secondOption, scheduleMode))
    ));
}

export function getTimeOptionKey(option) {
  return `${option.dayOfWeek}-${option.startTime}-${option.endTime}-${option.index}`;
}

export function countValidTimeBlocks(timeOptions) {
  return timeOptions.filter((option) => option.startTime && option.endTime && option.startTime < option.endTime).length;
}

export function getSeriesEndDate(startDate, recurringWeeks) {
  const weeks = Number(recurringWeeks);

  if (!startDate || !Number.isFinite(weeks) || weeks < 1) {
    return '';
  }

  return addDaysToDateInput(startDate, (weeks * 7) - 1);
}

export function countOfficeHourSlots(startDate, endDate, recurringWeeks, timeOptions) {
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

export function getCustomDateSummary(value) {
  return value ? formatLongDate(parseDayKey(value)) : 'Choose a date';
}

export function getPreviewLabel(option, scheduleMode, singleDate) {
  if (scheduleMode === 'recurring') {
    return getWeekdayLabel(option.dayOfWeek);
  }

  return getCustomDateSummary(singleDate);
}

export function getPreviewSummary(scheduleMode, officeHoursForm, seriesEndDate) {
  if (scheduleMode === 'recurring') {
    return `${officeHoursForm.recurringWeeks || 0} week schedule${seriesEndDate ? ` ending ${formatLongDate(parseDayKey(seriesEndDate))}` : ''}`;
  }

  return officeHoursForm.singleDate
    ? `Single-date availability on ${formatLongDate(parseDayKey(officeHoursForm.singleDate))}`
    : 'Choose a date for this availability.';
}

export function buildOfficeHoursPayload(scheduleMode, officeHoursForm, timeOptions, seriesEndDate) {
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

export function getCreateValidationMessage(scheduleMode, officeHoursForm, timeOptions, slotPreviewCount) {
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
