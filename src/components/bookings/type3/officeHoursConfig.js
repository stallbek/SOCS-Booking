import { getDayKey } from '../../../utils/date';

export const weekdayOptions = [
  { value: '1', label: 'Monday', shortLabel: 'Mon' },
  { value: '2', label: 'Tuesday', shortLabel: 'Tue' },
  { value: '3', label: 'Wednesday', shortLabel: 'Wed' },
  { value: '4', label: 'Thursday', shortLabel: 'Thu' },
  { value: '5', label: 'Friday', shortLabel: 'Fri' },
  { value: '6', label: 'Saturday', shortLabel: 'Sat' },
  { value: '0', label: 'Sunday', shortLabel: 'Sun' }
];

export function createInitialOfficeHoursForm() {
  const todayKey = getDayKey(new Date());

  return {
    title: '',
    startDate: todayKey,
    singleDate: todayKey,
    recurringWeeks: '5',
    description: ''
  };
}

export function createTimeOption(dayOfWeek = '') {
  return {
    dayOfWeek,
    startTime: '10:00',
    endTime: '10:30'
  };
}
