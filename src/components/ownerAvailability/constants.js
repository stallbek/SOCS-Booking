import { getDayKey } from '../../utils/date';

export const bookingTypes = [
  {
    id: 'type-1',
    label: 'Type 1',
    title: 'Request meeting',
    copy: 'Review incoming requests'
  },
  {
    id: 'type-2',
    label: 'Type 2',
    title: 'Group meeting',
    copy: 'Create group meetings slots'
  },
  {
    id: 'type-3',
    label: 'Type 3',
    title: 'Office hours',
    copy: 'Create office hours'
  }
];

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
