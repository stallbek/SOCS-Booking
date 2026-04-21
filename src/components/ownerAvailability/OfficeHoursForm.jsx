import OfficeHoursDetailsFields from './OfficeHoursDetailsFields';
import OfficeHoursPreview from './OfficeHoursPreview';
import TimeBlockEditor from './TimeBlockEditor';

function OfficeHoursForm({
  feedback,
  officeHoursForm,
  onAddTimeOption,
  onFieldChange,
  onModeChange,
  onRemoveTimeOption,
  onSubmit,
  onTimeOptionChange,
  previewSummary,
  saving,
  scheduleMode,
  seriesEndDate,
  slotPreviewCount,
  sortedTimeOptions,
  timeOptions
}) {
  const isRecurring = scheduleMode === 'recurring';
  const heading = isRecurring ? 'Create recurring availability' : 'Create single-date availability';
  const submitLabel = saving ? 'Saving' : heading;

  return (
    <section className="dashboard-card availability-form-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Type 3</p>
          <h2>{heading}</h2>
        </div>
        <span className="availability-form-note">Active when created</span>
      </div>

      <form className="office-hours-compose" onSubmit={onSubmit}>
        <OfficeHoursDetailsFields
          isRecurring={isRecurring}
          officeHoursForm={officeHoursForm}
          onFieldChange={onFieldChange}
          onModeChange={onModeChange}
          scheduleMode={scheduleMode}
          seriesEndDate={seriesEndDate}
        />

        <div className="calendar-method-layout">
          <TimeBlockEditor
            isRecurring={isRecurring}
            officeHoursForm={officeHoursForm}
            onAddTimeOption={onAddTimeOption}
            onRemoveTimeOption={onRemoveTimeOption}
            onTimeOptionChange={onTimeOptionChange}
            scheduleMode={scheduleMode}
            sortedTimeOptions={sortedTimeOptions}
            timeOptions={timeOptions}
          />

          <OfficeHoursPreview
            officeHoursForm={officeHoursForm}
            previewSummary={previewSummary}
            scheduleMode={scheduleMode}
            slotPreviewCount={slotPreviewCount}
            sortedTimeOptions={sortedTimeOptions}
          />
        </div>

        <div className="office-hours-footer">
          {feedback ? <div className="auth-notice">{feedback}</div> : null}

          <button className="button button-primary availability-submit" disabled={saving} type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

export default OfficeHoursForm;
