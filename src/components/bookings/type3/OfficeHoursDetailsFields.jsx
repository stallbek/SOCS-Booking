//Stalbek Ulanbek uulu 261102435
import { formatLongDate, parseDayKey } from '../../../utils/date';
import { getCustomDateSummary } from './officeHoursUtils';

function OfficeHoursDetailsFields({
  isRecurring,
  officeHoursForm,
  onFieldChange,
  onModeChange,
  scheduleMode,
  seriesEndDate
}) {
  return (
    <div className="calendar-compose-top">
      <div className="office-hours-mode-toggle" aria-label="Office hour type">
        <button
          className={`office-hours-mode-button${isRecurring ? ' office-hours-mode-button-active' : ''}`}
          onClick={() => onModeChange('recurring')}
          type="button"
        >
          <span>Recurring schedule</span>
          <strong>Repeats by week</strong>
        </button>

        <button
          className={`office-hours-mode-button${!isRecurring ? ' office-hours-mode-button-active' : ''}`}
          onClick={() => onModeChange('single')}
          type="button"
        >
          <span>Single-date session</span>
          <strong>Specific date only</strong>
        </button>
      </div>

      <label className="form-field office-hours-title-field">
        <span>OH title</span>
        <input
          name="title"
          onChange={(event) => onFieldChange(event.target.name, event.target.value)}
          placeholder="Add title"
          type="text"
          value={officeHoursForm.title}
        />
      </label>

      {isRecurring ? (
        <div className="calendar-series-grid">
          <label className="form-field">
            <span>First week starts</span>
            <input
              name="startDate"
              onChange={(event) => onFieldChange(event.target.name, event.target.value)}
              type="date"
              value={officeHoursForm.startDate}
            />
          </label>

          <label className="form-field">
            <span>Repeat for</span>
            <div className="weeks-field">
              <input
                min="1"
                name="recurringWeeks"
                onChange={(event) => onFieldChange(event.target.name, event.target.value)}
                type="number"
                value={officeHoursForm.recurringWeeks}
              />
              <span>weeks</span>
            </div>
          </label>

          <div className="series-summary" aria-live="polite">
            <strong>Runs through: {seriesEndDate ? formatLongDate(parseDayKey(seriesEndDate)) : 'Choose a start date'}</strong>
          </div>
        </div>
      ) : (
        <div className="calendar-series-grid calendar-series-grid-single">
          <label className="form-field">
            <span>Office-hour date</span>
            <input
              name="singleDate"
              onChange={(event) => onFieldChange(event.target.name, event.target.value)}
              type="date"
              value={officeHoursForm.singleDate}
            />
          </label>

          <div className="series-summary" aria-live="polite">
            <strong>Selected day: {getCustomDateSummary(officeHoursForm.singleDate)}</strong>
          </div>
        </div>
      )}

      <label className="form-field">
        <span>Description</span>
        <textarea
          name="description"
          onChange={(event) => onFieldChange(event.target.name, event.target.value)}
          placeholder="Add location, topic, or booking note"
          rows="2"
          value={officeHoursForm.description}
        ></textarea>
      </label>
    </div>
  );
}

export default OfficeHoursDetailsFields;
