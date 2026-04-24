import { getDatePart } from '../../../utils/date';

export function getTimeOptionId(option) {
  return option?._id || option?.id || '';
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
