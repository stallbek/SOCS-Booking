//Stalbek Ulanbek uulu 261102435

import { getPreviewLabel, getTimeOptionKey } from './officeHoursUtils';

function OfficeHoursPreview({
  officeHoursForm,
  previewSummary,
  scheduleMode,
  slotPreviewCount,
  sortedTimeOptions
}) {
  return (
    <aside className="office-hours-preview-card">
      <h3>Meeting preview</h3>
      <p>{slotPreviewCount} bookable slot{slotPreviewCount === 1 ? '' : 's'}</p>
      <p>{previewSummary}</p>

      <div className="office-hours-preview-list">
        {sortedTimeOptions.map((option) => (
          <div className="office-hours-preview-item" key={`preview-${getTimeOptionKey(option)}`}>
            <span>{getPreviewLabel(option, scheduleMode, officeHoursForm.singleDate)}</span>
            <strong>{option.startTime} - {option.endTime}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default OfficeHoursPreview;
