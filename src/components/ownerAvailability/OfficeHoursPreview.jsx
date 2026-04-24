//Stalbek Ulanbek uulu 261102435

import { getPreviewLabel, getTimeOptionKey } from './utils';

function OfficeHoursPreview({
  officeHoursForm,
  previewSummary,
  scheduleMode,
  slotPreviewCount,
  sortedTimeOptions
}) {
  return (
    <aside className="office-hours-preview-card">
      <p className="eyebrow">Preview</p>
      <h3>{slotPreviewCount} bookable slots</h3>
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
