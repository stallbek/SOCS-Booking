import { buildDateTime, getDatePart, getDayKey } from '../../../utils/date';

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getOptionId(option) {
  return option?._id || option?.id || '';
}

function getTimeMinutes(value) {
  const [hours, minutes] = String(value || '')
    .split(':')
    .map(Number);

  return (hours * 60) + minutes;
}

function sortBlocks(blocks) {
  return [...blocks].sort((firstBlock, secondBlock) => firstBlock.startTime.localeCompare(secondBlock.startTime));
}

function flattenDateCards(dateCards) {
  return dateCards.flatMap((dateCard) => dateCard.timeBlocks.map((timeBlock) => ({
    date: dateCard.date,
    endTime: timeBlock.endTime,
    startTime: timeBlock.startTime
  })));
}

export function createInitialGroupMeetingForm() {
  return {
    description: '',
    title: ''
  };
}

export function createGroupMeetingTimeBlock() {
  return {
    endTime: '10:30',
    id: createLocalId('time'),
    startTime: '10:00'
  };
}

export function createGroupMeetingDateCard(date = getDayKey(new Date())) {
  return {
    date,
    id: createLocalId('date'),
    timeBlocks: [createGroupMeetingTimeBlock()]
  };
}

export function getGroupMeetingOptionCount(dateCards) {
  return flattenDateCards(dateCards).length;
}

export function getGroupedMeetingOptions(options) {
  const groups = new Map();

  (Array.isArray(options) ? options : [])
    .slice()
    .sort((firstOption, secondOption) => {
      const firstDateKey = getDatePart(firstOption.date);
      const secondDateKey = getDatePart(secondOption.date);

      if (firstDateKey !== secondDateKey) {
        return firstDateKey.localeCompare(secondDateKey);
      }

      return firstOption.startTime.localeCompare(secondOption.startTime);
    })
    .forEach((option) => {
      const dateKey = getDatePart(option.date);

      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          dateKey,
          options: []
        });
      }

      groups.get(dateKey).options.push(option);
    });

  return Array.from(groups.values());
}

export function getGroupMeetingPreview(dateCards) {
  return getGroupedMeetingOptions(flattenDateCards(dateCards));
}

export function getGroupMeetingSummary(dateCards) {
  const optionCount = getGroupMeetingOptionCount(dateCards);
  const dateCount = getGroupMeetingPreview(dateCards).length;

  if (!dateCount || !optionCount) {
    return 'Add dates and time blocks to build the meeting.';
  }

  return `${dateCount} date${dateCount === 1 ? '' : 's'}, ${optionCount} option${optionCount === 1 ? '' : 's'}`;
}

export function getGroupMeetingValidationMessage(form, dateCards, now = new Date()) {
  if (!form.title.trim()) {
    return 'Add a group meeting title.';
  }

  if (!dateCards.length) {
    return 'Add at least one date.';
  }

  const todayKey = getDayKey(now);
  const seenBlocks = new Set();
  let hasFutureOption = false;

  for (const dateCard of dateCards) {
    if (!dateCard.date) {
      return 'Choose a date for each date card.';
    }

    if (dateCard.date < todayKey) {
      return 'Choose today or a future date.';
    }

    if (!dateCard.timeBlocks.length) {
      return 'Add at least one time block for each date.';
    }

    const blocks = [];

    for (const timeBlock of dateCard.timeBlocks) {
      if (!timeBlock.startTime || !timeBlock.endTime || timeBlock.startTime >= timeBlock.endTime) {
        return 'Each time block needs an end time after its start time.';
      }

      const blockKey = `${dateCard.date}-${timeBlock.startTime}-${timeBlock.endTime}`;

      if (seenBlocks.has(blockKey)) {
        return 'Remove duplicate time blocks.';
      }

      seenBlocks.add(blockKey);
      blocks.push({
        end: getTimeMinutes(timeBlock.endTime),
        start: getTimeMinutes(timeBlock.startTime)
      });

      const optionEnd = new Date(buildDateTime(dateCard.date, timeBlock.endTime));

      if (Number.isFinite(optionEnd.getTime()) && optionEnd > now) {
        hasFutureOption = true;
      }
    }

    const sortedBlocks = blocks.sort((firstBlock, secondBlock) => firstBlock.start - secondBlock.start);

    for (let index = 1; index < sortedBlocks.length; index += 1) {
      if (sortedBlocks[index].start < sortedBlocks[index - 1].end) {
        return 'Time blocks on the same date cannot overlap.';
      }
    }
  }

  if (!hasFutureOption) {
    return 'Add at least one future time option.';
  }

  return '';
}

export function buildGroupMeetingPayload(form, dateCards) {
  const timeOptions = flattenDateCards(dateCards).sort((firstOption, secondOption) => {
    if (firstOption.date !== secondOption.date) {
      return firstOption.date.localeCompare(secondOption.date);
    }

    return firstOption.startTime.localeCompare(secondOption.startTime);
  });

  return {
    description: form.description.trim(),
    endDate: timeOptions[timeOptions.length - 1].date,
    startDate: timeOptions[0].date,
    timeOptions,
    title: form.title.trim()
  };
}

export function getGroupMeetingShareLink(inviteCode) {
  const path = `/app/owners?groupCode=${inviteCode}`;

  if (typeof window === 'undefined') {
    return path;
  }

  return `${window.location.origin}${path}`;
}

export function getSelectedGroupOptionId(group) {
  if (!group?.selectedOption) {
    return '';
  }

  return getOptionId(
    (group.timeOptions || []).find((option) => (
      getDatePart(option.date) === getDatePart(group.selectedOption.date)
      && option.startTime === group.selectedOption.startTime
      && option.endTime === group.selectedOption.endTime
    ))
  );
}

export function sortDateCardTimeBlocks(dateCard) {
  return {
    ...dateCard,
    timeBlocks: sortBlocks(dateCard.timeBlocks)
  };
}
