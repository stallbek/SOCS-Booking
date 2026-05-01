//Stalbek Ulanbek uulu 261102435
function OfficeHourTimeEditForm({
  feedback,
  form,
  onCancel,
  onChange,
  onSubmit,
  saving
}) {
  return (
    <form className="office-hour-edit-form" onSubmit={onSubmit}>
      <input
        aria-label="New start time"
        disabled={saving}
        name="startTime"
        onChange={(event) => onChange(event.target.name, event.target.value)}
        type="time"
        value={form.startTime}
      />

      <span>to</span>

      <input
        aria-label="New end time"
        disabled={saving}
        name="endTime"
        onChange={(event) => onChange(event.target.name, event.target.value)}
        type="time"
        value={form.endTime}
      />

      <div className="office-hour-edit-actions">
        <button className="button button-primary" disabled={saving} type="submit">
          {saving ? 'Saving' : 'Save'}
        </button>

        <button className="text-link" disabled={saving} onClick={onCancel} type="button">
          ✖
        </button>
      </div>

      {feedback ? <div className="inline-feedback inline-feedback-error">{feedback}</div> : null}
    </form>
  );
}

export default OfficeHourTimeEditForm;
