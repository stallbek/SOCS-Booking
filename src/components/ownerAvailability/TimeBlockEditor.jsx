import { formatLongDate, parseDayKey } from '../../utils/date';
import { weekdayOptions } from './constants';
import { getCustomDateSummary, getTimeOptionKey } from './utils';

function getTopCopy(scheduleMode) {
  return scheduleMode === 'recurring'
    ? 'Set a weekly schedule that repeats for the selected number of weeks.'
    : 'Set OH times for one specific date.';
}

function getPatternHeading(scheduleMode, singleDate) {
  if (scheduleMode === 'recurring') {
    return 'Define the weekly schedule.';
  }

  return singleDate
    ? `Set the available times for ${formatLongDate(parseDayKey(singleDate))}`
    : 'Choose the session date.';
}

function getEmptyPatternCopy(scheduleMode) {
  return scheduleMode === 'recurring'
    ? 'Choose a weekday or add a blank row, then set the times.'
    : 'Add one or more time blocks for the selected date.';
}

function TimeBlockEditor({
  isRecurring,
  officeHoursForm,
  onAddTimeOption,
  onRemoveTimeOption,
  onTimeOptionChange,
  scheduleMode,
  sortedTimeOptions,
  timeOptions
}) {
  const weekdayCounts = timeOptions.reduce((counts, option) => {
    if (!option.dayOfWeek) {
      return counts;
    }

    return {
      ...counts,
      [option.dayOfWeek]: (counts[option.dayOfWeek] || 0) + 1
    };
  }, {});

  return (
    <div className="weekly-pattern-panel">
      <div className="weekly-pattern-head">
        <div>
          <h3>{getPatternHeading(scheduleMode, officeHoursForm.singleDate)}</h3>
        </div>

        <button className="button button-muted" onClick={() => onAddTimeOption()} type="button">
          Add time block
        </button>
      </div>

      <p className="office-hours-top-copy">{getTopCopy(scheduleMode)}</p>

      {isRecurring ? (
        <div className="weekday-chip-row" aria-label="Add a weekly office-hour block">
          {weekdayOptions.map((weekday) => {
            const dayCount = weekdayCounts[weekday.value] || 0;

            return (
              <button
                className={`weekday-chip${dayCount ? ' weekday-chip-active' : ''}`}
                key={weekday.value}
                onClick={() => onAddTimeOption(weekday.value)}
                type="button"
              >
                <span>{weekday.shortLabel}</span>
                <strong>{dayCount || '+'}</strong>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="calendar-block-list">
        {sortedTimeOptions.length ? sortedTimeOptions.map((option) => (
          <div className={isRecurring ? 'calendar-block-row' : 'calendar-block-row calendar-block-row-single'} key={getTimeOptionKey(option)}>
            {isRecurring ? (
              <select
                aria-label="Office hour day"
                name="dayOfWeek"
                onChange={(event) => onTimeOptionChange(option.index, event.target.name, event.target.value)}
                value={option.dayOfWeek}
              >
                <option value="">Choose day</option>
                {weekdayOptions.map((weekday) => (
                  <option key={weekday.value} value={weekday.value}>
                    {weekday.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="calendar-block-day-label">
                <span>Day</span>
                <strong>{getCustomDateSummary(officeHoursForm.singleDate)}</strong>
              </div>
            )}

            <input
              aria-label="Start time"
              name="startTime"
              onChange={(event) => onTimeOptionChange(option.index, event.target.name, event.target.value)}
              type="time"
              value={option.startTime}
            />

            <span>to</span>

            <input
              aria-label="End time"
              name="endTime"
              onChange={(event) => onTimeOptionChange(option.index, event.target.name, event.target.value)}
              type="time"
              value={option.endTime}
            />

            <button
              aria-label="Remove office hour block"
              className="calendar-block-remove"
              onClick={() => onRemoveTimeOption(option.index)}
              type="button"
            >
              X
            </button>
          </div>
        )) : (
          <div className="dashboard-empty-state calendar-block-empty">
            <h3>No time blocks yet</h3>
            <p>{getEmptyPatternCopy(scheduleMode)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeBlockEditor;
