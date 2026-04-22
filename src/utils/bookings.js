import { buildDateTime } from './date';

export const bookingTypeOptions = [
  {
    id: 'type-1',
    label: 'Type 1',
    title: 'Request meeting',
    colorClass: 'booking-type-dot-type-1'
  },
  {
    id: 'type-2',
    label: 'Type 2',
    title: 'Group meeting',
    colorClass: 'booking-type-dot-type-2'
  },
  {
    id: 'type-3',
    label: 'Type 3',
    title: 'Office hours',
    colorClass: 'booking-type-dot-type-3'
  }
];

export const allBookingTypeIds = bookingTypeOptions.map((option) => option.id);

export function getBookingTypeMeta(typeId) {
  return bookingTypeOptions.find((option) => option.id === typeId) || bookingTypeOptions[0];
}

export function getBookingTypeFromSlot(slot) {
  if (slot?.slotType === 'office-hours') {
    return 'type-3';
  }

  if (slot?.slotType === 'group') {
    return 'type-2';
  }

  return 'type-1';
}

export function getItemId(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value._id || value.id || '';
}

export function getBookedById(slot) {
  return getItemId(slot?.bookedBy);
}

export function getSlotDateTimes(slot) {
  return {
    startAt: buildDateTime(slot.date, slot.startTime),
    endAt: buildDateTime(slot.date, slot.endTime)
  };
}

export function hasSlotStarted(slot, now = new Date()) {
  const { startAt } = getSlotDateTimes(slot);
  const startDate = new Date(startAt);

  return Number.isFinite(startDate.getTime()) && startDate <= now;
}

export function isOfficeHoursSlot(slot) {
  return slot?.slotType === 'office-hours';
}

export function filterOfficeHoursSlots(slots) {
  return (Array.isArray(slots) ? slots : []).filter(isOfficeHoursSlot);
}

export function getStudentSlotState(slot, currentUserId, now = new Date()) {
  const bookedById = getBookedById(slot);
  const isBooked = Boolean(bookedById);
  const isMine = Boolean(bookedById && String(bookedById) === String(currentUserId));
  const isPast = hasSlotStarted(slot, now);
  const isBookable = !isBooked && !isPast;

  if (isMine) {
    return {
      isBooked,
      isMine,
      isPast,
      isBookable,
      statusLabel: isPast ? 'Completed' : 'Reserved',
      note: isPast ? 'You reserved this past slot.' : 'You already reserved this slot.'
    };
  }

  if (isBooked) {
    return {
      isBooked,
      isMine,
      isPast,
      isBookable,
      statusLabel: isPast ? 'Completed' : 'Booked',
      note: isPast ? 'This reserved slot has passed.' : 'This slot is already reserved.'
    };
  }

  if (isPast) {
    return {
      isBooked,
      isMine,
      isPast,
      isBookable,
      statusLabel: 'Past',
      note: 'This slot has passed.'
    };
  }

  return {
    isBooked,
    isMine,
    isPast,
    isBookable,
    statusLabel: 'Open',
    note: 'Open for booking.'
  };
}

export function getOwnerSlotState(slot, now = new Date()) {
  const bookedName = slot.bookedByName || slot.bookedBy?.name || '';
  const bookedEmail = slot.bookedByEmail || slot.bookedBy?.email || '';
  const isBooked = Boolean(bookedName || bookedEmail || slot.bookedBy);
  const isPast = hasSlotStarted(slot, now);

  if (isBooked) {
    return {
      bookedEmail,
      bookedName,
      isBooked,
      isPast,
      statusLabel: isPast ? 'Completed' : 'Reserved',
      note: `Reserved by ${bookedName || bookedEmail || 'student'}`
    };
  }

  if (isPast) {
    return {
      bookedEmail,
      bookedName,
      isBooked,
      isPast,
      statusLabel: 'Past',
      note: 'This availability has passed.'
    };
  }

  return {
    bookedEmail,
    bookedName,
    isBooked,
    isPast,
    statusLabel: 'Available',
    note: 'Open for student booking.'
  };
}

export function mapOwnerAppointmentEvent(slot) {
  const { startAt, endAt } = getSlotDateTimes(slot);
  const state = getOwnerSlotState(slot);
  const bookingType = getBookingTypeFromSlot(slot);
  const bookingTypeMeta = getBookingTypeMeta(bookingType);

  return {
    id: slot._id,
    bookingType,
    bookingTypeLabel: bookingTypeMeta.label,
    title: slot.title,
    startAt,
    endAt,
    isPast: state.isPast,
    location: bookingTypeMeta.title,
    note: slot.description || 'Student reservation confirmed.',
    statusLabel: state.isPast ? 'Completed' : 'Booked',
    withName: state.bookedName || 'Student',
    withEmail: state.bookedEmail
  };
}

export function mapOwnerCalendarEvent(slot) {
  const { startAt, endAt } = getSlotDateTimes(slot);
  const state = getOwnerSlotState(slot);
  const bookingType = getBookingTypeFromSlot(slot);
  const bookingTypeMeta = getBookingTypeMeta(bookingType);

  return {
    id: slot._id,
    bookingType,
    bookingTypeLabel: bookingTypeMeta.label,
    title: slot.title,
    startAt,
    endAt,
    isPast: state.isPast,
    location: bookingTypeMeta.title,
    note: state.note,
    statusLabel: state.statusLabel
  };
}

export function mapStudentAppointmentEvent(slot) {
  const { startAt, endAt } = getSlotDateTimes(slot);
  const isPast = hasSlotStarted(slot);
  const bookingType = getBookingTypeFromSlot(slot);
  const bookingTypeMeta = getBookingTypeMeta(bookingType);

  return {
    id: slot._id,
    bookingType,
    bookingTypeLabel: bookingTypeMeta.label,
    title: slot.title,
    startAt,
    endAt,
    isPast,
    location: bookingTypeMeta.title,
    note: slot.description || 'Owner reservation confirmed.',
    statusLabel: isPast ? 'Completed' : 'Reserved',
    withName: slot.owner?.name || 'Owner',
    withEmail: slot.owner?.email || ''
  };
}

export function createMailtoAction(href, label) {
  if (!href || !href.startsWith('mailto:')) {
    return null;
  }

  return { href, label };
}
