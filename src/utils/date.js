//Stalbek Ulanbek uulu 261102435
function toDate(value) {
  return value instanceof Date ? new Date(value) : new Date(value);
}

function getDayKey(value) {
  const date = toDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDayKey(dayKey) {
  return new Date(`${dayKey}T12:00:00`);
}

function getDatePart(value) {
  if (typeof value === 'string') {
    return value.includes('T') ? value.split('T')[0] : value;
  }

  return getDayKey(value);
}

function buildDateTime(dateValue, timeValue) {
  return `${getDatePart(dateValue)}T${timeValue}:00`;
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(toDate(value));
}

function formatMonthLabel(value) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    year: 'numeric',
  }).format(toDate(value));
}

function formatTimeRange(startValue, endValue) {
  const format = new Intl.DateTimeFormat('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${format.format(toDate(startValue))} - ${format.format(toDate(endValue))}`;
}

function groupItemsByDay(items) {
  const groups = new Map();

  items.forEach((item) => {
    const dayKey = getDayKey(item.startAt);

    if (!groups.has(dayKey)) {
      groups.set(dayKey, []);
    }

    groups.get(dayKey).push(item);
  });

  return Array.from(groups.entries())
    .sort((firstItem, secondItem) => new Date(firstItem[0]) - new Date(secondItem[0]))
    .map(([dayKey, dayItems]) => ({
      dayKey,
      label: formatLongDate(parseDayKey(dayKey)),
      items: dayItems.sort((firstItem, secondItem) => new Date(firstItem.startAt) - new Date(secondItem.startAt)),
    }));
}

export { buildDateTime, formatLongDate, formatMonthLabel, formatTimeRange, getDatePart, getDayKey, groupItemsByDay, parseDayKey };
