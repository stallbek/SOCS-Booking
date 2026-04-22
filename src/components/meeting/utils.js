import { getDatePart, getDayKey } from '../../utils/date';

export function createInitialMeetingRequestForm() {
  const todayKey = getDayKey(new Date());

  return {
    message: '',
    preferredDate: todayKey,
    preferredStartTime: '10:00',
    preferredEndTime: '10:30'
  };
}

export function getRequestId(request) {
  return request?._id || request?.id || '';
}

export function getTimeOptionId(option) {
  return option?._id || option?.id || '';
}

export function getRequestPerson(request, view) {
  const person = view === 'owner' ? request?.fromUser : request?.toOwner;

  return {
    name: person?.name || 'Unknown user',
    email: person?.email || ''
  };
}

export function normalizeStatus(value) {
  const status = value || 'pending';

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function isDateBeforeToday(value) {
  return value && value < getDayKey(new Date());
}

export function getMeetingRequestValidationMessage(form) {
  if (!form.message.trim()) {
    return 'Add a short request message.';
  }

  if (!form.preferredDate) {
    return 'Choose a preferred date.';
  }

  if (isDateBeforeToday(form.preferredDate)) {
    return 'Choose today or a future preferred date.';
  }

  if (!form.preferredStartTime || !form.preferredEndTime || form.preferredStartTime >= form.preferredEndTime) {
    return 'Choose an end time after the start time.';
  }

  return '';
}

export function buildMeetingRequestPayload(ownerId, form) {
  return {
    toOwnerId: ownerId,
    message: form.message.trim(),
    preferredDate: form.preferredDate,
    preferredStartTime: form.preferredStartTime,
    preferredEndTime: form.preferredEndTime
  };
}

export function getGroupOptionDateKey(option) {
  return getDatePart(option.date);
}

export function getVoteCount(option) {
  return Array.isArray(option?.votes) ? option.votes.length : 0;
}

export function getVoteUserId(vote) {
  return typeof vote === 'string' ? vote : vote?._id || vote?.id || '';
}

export function getCurrentUserVoteIds(group, currentUserId) {
  return (group?.timeOptions || [])
    .filter((option) => (option.votes || []).some((vote) => String(getVoteUserId(vote)) === String(currentUserId)))
    .map(getTimeOptionId);
}

export function createEmailAction(email, label, subject = '', body = '') {
  if (!email) {
    return null;
  }

  const params = new URLSearchParams();

  if (subject) {
    params.set('subject', subject);
  }

  if (body) {
    params.set('body', body);
  }

  return {
    href: `mailto:${email}${params.toString() ? `?${params.toString()}` : ''}`,
    label
  };
}
