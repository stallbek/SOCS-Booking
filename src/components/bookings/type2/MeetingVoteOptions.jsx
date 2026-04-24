//Stalbek Ulanbek uulu 261102435

import { buildDateTime, formatLongDate, formatTimeRange, parseDayKey } from '../../../utils/date';
import { getGroupedMeetingOptions } from './groupMeetingUtils';
import {
  getGroupOptionDateKey,
  getTimeOptionId,
  getVoteCount
} from './voteUtils';

function MeetingVoteOptions({
  highlightedOptionId = '',
  onToggleOption,
  options,
  readOnly = false,
  selectedOptionIds = []
}) {
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
      {getGroupedMeetingOptions(options).map((group) => (
        <section className="meeting-option-group" key={group.dateKey}>
          <div className="meeting-option-group-head">
            <p className="meeting-option-group-label">{formatLongDate(parseDayKey(group.dateKey))}</p>
            <span>{group.options.length} slot{group.options.length === 1 ? '' : 's'}</span>
          </div>

          <div className="meeting-option-group-list">
            {group.options.map((option) => {
              const optionId = getTimeOptionId(option);
              const dateKey = getGroupOptionDateKey(option);
              const isSelected = selectedOptionIds.includes(optionId);
              const isHighlighted = highlightedOptionId === optionId;
              const startAt = buildDateTime(dateKey, option.startTime);
              const endAt = buildDateTime(dateKey, option.endTime);
              const voteCount = getVoteCount(option);

              return (
                <article
                  className={`meeting-option-row${isSelected || isHighlighted ? ' meeting-option-row-selected' : ''}${readOnly ? ' meeting-option-row-readonly' : ''}`}
                  key={optionId}
                >
                  <div className="meeting-option-main">
                    <strong>{formatTimeRange(startAt, endAt)}</strong>
                    <p>{voteCount} vote{voteCount === 1 ? '' : 's'}</p>
                  </div>

                  {readOnly ? (
                    <span className="meeting-option-state">
                      {isHighlighted ? 'Final time' : 'Read only'}
                    </span>
                  ) : (
                    <label className="meeting-option-toggle">
                      <input
                        checked={isSelected}
                        onChange={() => onToggleOption(optionId)}
                        type="checkbox"
                      />
                      <span>{isSelected ? 'Selected' : 'Select'}</span>
                    </label>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default MeetingVoteOptions;
