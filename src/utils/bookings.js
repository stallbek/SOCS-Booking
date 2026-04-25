import { buildDateTime } from './date';

//Stalbek Ulanbek uulu 261102435

export const bookingTypeOptions = [
  {
    id: 'type-1',
    label: 'Type 1',
    filterLabel: 'Meeting',
    title: 'Request meeting',
    colorClass: 'booking-type-dot-type-1'
  },
  {
    id: 'type-2',
    label: 'Type 2',
    filterLabel: 'Group Meeting',
    title: 'Group meeting',
    colorClass: 'booking-type-dot-type-2'
  },
  {
    id: 'type-3',
    label: 'Type 3',
    filterLabel: 'Office Hour',
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

function getSlotAttendees(slot) {
  return Array.isArray(slot?.attendees) ? slot.attendees : [];
}

function getPersonName(person) {
  return person && typeof person === 'object' ? person.name || '' : '';
}

function getPersonEmail(person) {
  return person && typeof person === 'object' ? person.email || '' : '';
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
  const isMultiAttendeeSlot = slot?.slotType === 'group' || slot?.slotType === 'office-hours';
  const attendeeCount = getSlotAttendees(slot).length || (isMultiAttendeeSlot && bookedById ? 1 : 0);
  const isBooked = Boolean(bookedById);
  const isMine = Boolean(bookedById && String(bookedById) === String(currentUserId));
  const isPast = hasSlotStarted(slot, now);
  const note = isMultiAttendeeSlot ? `Attendees: ${attendeeCount}` : 'Open for booking.';

  if (isMine) {
    return {
      isBooked,
      isMine,
      isPast,
      statusLabel: isPast ? 'Completed' : 'Reserved',
      note
    };
  }

  if (isBooked) {
    return {
      isBooked,
      isMine,
      isPast,
      statusLabel: isPast ? 'Completed' : 'Booked',
      note
    };
  }

  if (isPast) {
    return {
      isBooked,
      isMine,
      isPast,
      statusLabel: 'Past',
      note: isMultiAttendeeSlot ? note : 'This slot has passed.'
    };
  }

  return {
    isBooked,
    isMine,
    isPast,
    statusLabel: 'Open',
    note
  };
}

export function getOwnerSlotState(slot, now = new Date()) {
  const attendees = getSlotAttendees(slot);
  const attendeeEmails = attendees.map(getPersonEmail).filter(Boolean);
  const isMultiAttendeeSlot = slot?.slotType === 'group' || slot?.slotType === 'office-hours';
  const attendeeCount = Number(slot.attendeeCount) || attendees.length || (isMultiAttendeeSlot && slot.bookedBy ? 1 : 0);
  const bookedName = isMultiAttendeeSlot
    ? String(attendeeCount)
    : slot.bookedByName || slot.bookedBy?.name || '';
  const bookedEmail = slot.bookedByEmail || slot.bookedBy?.email || attendeeEmails.join(',');
  const isBooked = Boolean(bookedName || bookedEmail || slot.bookedBy || attendeeCount);
  const isPast = hasSlotStarted(slot, now);
  const note = isMultiAttendeeSlot ? `Attendees: ${attendeeCount}` : `Reserved by ${bookedName || bookedEmail || 'student'}`;

  if (isBooked) {
    return {
      attendeeCount,
      bookedEmail,
      bookedName,
      isBooked,
      isPast,
      statusLabel: isPast ? 'Completed' : slot?.slotType === 'group' ? 'Scheduled' : 'Reserved',
      note
    };
  }

  if (isPast) {
    return {
      bookedEmail,
      bookedName,
      isBooked,
      isPast,
      statusLabel: 'Past',
      note: isMultiAttendeeSlot ? note : 'This availability has passed.'
    };
  }

  return {
    attendeeCount,
    bookedEmail,
    bookedName,
    isBooked,
    isPast,
    statusLabel: 'Available',
    note: isMultiAttendeeSlot ? note : 'Open for student booking.'
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
    title: slot.title,
    startAt,
    endAt,
    isPast: state.isPast,
    location: bookingTypeMeta.title,
    note: slot.description || state.note || 'Student reservation confirmed.',
    statusLabel: state.isPast ? 'Completed' : bookingType === 'type-2' ? 'Scheduled' : 'Booked',
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
  const isGroupMeeting = bookingType === 'type-2';

  return {
    id: slot._id,
    bookingType,
    title: slot.title,
    startAt,
    endAt,
    isPast,
    location: bookingTypeMeta.title,
    note: slot.description || (isGroupMeeting ? 'Group meeting finalized.' : 'Owner reservation confirmed.'),
    statusLabel: isPast ? 'Completed' : isGroupMeeting ? 'Scheduled' : 'Reserved',
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
