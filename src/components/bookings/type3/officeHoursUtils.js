import { ownerBookingTypes } from '../shared/bookingTypeOptions';
import { weekdayOptions } from './officeHoursConfig';
import {
  formatLongDate,
  getDayKey,
  parseDayKey
} from '../../../utils/date';
import {
  filterOfficeHoursSlots,
  getBookingTypeFromSlot,
  getOwnerSlotState,
  getSlotDateTimes
} from '../../../utils/bookings';

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

function getTimeMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

function isDateBeforeToday(value) {
  return value && value < getDayKey(new Date());
}

export function getSelectedBookingType(typeId) {
  return ownerBookingTypes.find((type) => type.id === typeId) || ownerBookingTypes[2];
}

export { filterOfficeHoursSlots };

export function mapSlotToEvent(slot) {
  const { startAt, endAt } = getSlotDateTimes(slot);
  const state = getOwnerSlotState(slot);

  return {
    id: slot._id,
    bookingType: getBookingTypeFromSlot(slot),
    title: slot.title,
    startAt,
    endAt,
    description: slot.description || '',
    statusLabel: state.statusLabel,
    isBooked: state.isBooked,
    isPast: state.isPast,
    bookedName: state.bookedName,
    bookedEmail: state.bookedEmail,
    recurringGroupId: slot.recurringGroupId || '',
    note: state.note
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
    ? `Single OH on ${formatLongDate(parseDayKey(officeHoursForm.singleDate))}`
    : 'Choose a date for this OH.';
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

  if (scheduleMode === 'recurring' && isDateBeforeToday(officeHoursForm.startDate)) {
    return 'Choose today or a future first week date.';
  }

  if (scheduleMode === 'single' && !officeHoursForm.singleDate) {
    return 'Choose the session date.';
  }

  if (scheduleMode === 'single' && isDateBeforeToday(officeHoursForm.singleDate)) {
    return 'Choose today or a future session date.';
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

  const seenBlocks = new Set();
  const blocksByDay = new Map();

  for (const option of timeOptions) {
    const dayKey = scheduleMode === 'recurring' ? String(option.dayOfWeek) : officeHoursForm.singleDate;
    const blockKey = `${dayKey}-${option.startTime}-${option.endTime}`;
    const block = {
      start: getTimeMinutes(option.startTime),
      end: getTimeMinutes(option.endTime)
    };

    if (seenBlocks.has(blockKey)) {
      return 'Remove duplicate time blocks.';
    }

    seenBlocks.add(blockKey);

    if (!blocksByDay.has(dayKey)) {
      blocksByDay.set(dayKey, []);
    }

    blocksByDay.get(dayKey).push(block);
  }

  for (const blocks of blocksByDay.values()) {
    const sortedBlocks = [...blocks].sort((firstBlock, secondBlock) => firstBlock.start - secondBlock.start);

    for (let index = 1; index < sortedBlocks.length; index += 1) {
      if (sortedBlocks[index].start < sortedBlocks[index - 1].end) {
        return 'Time blocks on the same day cannot overlap.';
      }
    }
  }

  if (!slotPreviewCount) {
    return scheduleMode === 'recurring'
      ? 'The selected weekly pattern does not create any slots.'
      : 'The selected single-date setup does not create any slots.';
  }

  return '';
}
