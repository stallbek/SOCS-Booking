//Stalbek Ulanbek uulu 261102435

import { buildDateTime, formatLongDate, formatTimeRange, parseDayKey } from '../../utils/date';
import {
  getGroupOptionDateKey,
  getTimeOptionId,
  getVoteCount
} from './utils';

function MeetingVoteOptions({ onToggleOption, options, selectedOptionIds }) {
  if (!options.length) {
    return (
      <div className="dashboard-empty-state calendar-block-empty">
        <h3>No time options</h3>
        <p>This group meeting does not have voting options.</p>
      </div>
    );
  }

  return (
    <div className="meeting-option-list">
      {options.map((option) => {
        const optionId = getTimeOptionId(option);
        const dateKey = getGroupOptionDateKey(option);
        const isSelected = selectedOptionIds.includes(optionId);
        const startAt = buildDateTime(dateKey, option.startTime);
        const endAt = buildDateTime(dateKey, option.endTime);

        return (
          <article className={`meeting-option-row${isSelected ? ' meeting-option-row-selected' : ''}`} key={optionId}>
            <div className="meeting-option-main">
              <span>{formatLongDate(parseDayKey(dateKey))}</span>
              <strong>{formatTimeRange(startAt, endAt)}</strong>
              <p>{getVoteCount(option)} vote{getVoteCount(option) === 1 ? '' : 's'}</p>
            </div>

            <label className="meeting-option-toggle">
              <input
                checked={isSelected}
                onChange={() => onToggleOption(optionId)}
                type="checkbox"
              />
              <span>{isSelected ? 'Selected' : 'Select'}</span>
            </label>
          </article>
        );
      })}
    </div>
  );
}

export default MeetingVoteOptions;
