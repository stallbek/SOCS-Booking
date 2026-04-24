//Stalbek Ulanbek uulu 261102435

function MeetingDetailsFields({
  descriptionLabel = 'Description',
  descriptionName = 'description',
  descriptionPlaceholder = '',
  form,
  onFieldChange,
  showDateTime = false,
  showDescription = true,
  showTitle = true,
  titleLabel = 'Title',
  titleName = 'title',
  titlePlaceholder = ''
}) {
  const handleChange = (event) => {
    onFieldChange(event.target.name, event.target.value);
  };

  return (
    <div className="meeting-details-fields">
      {showTitle ? (
        <label className="form-field office-hours-title-field">
          <span>{titleLabel}</span>
          <input
            name={titleName}
            onChange={handleChange}
            placeholder={titlePlaceholder}
            type="text"
            value={form[titleName] || ''}
          />
        </label>
      ) : null}

      {showDescription ? (
        <label className="form-field">
          <span>{descriptionLabel}</span>
          <textarea
            name={descriptionName}
            onChange={handleChange}
            placeholder={descriptionPlaceholder}
            rows="3"
            value={form[descriptionName] || ''}
          ></textarea>
        </label>
      ) : null}

      {showDateTime ? (
        <div className="meeting-date-time-grid">
          <label className="form-field">
            <span>Preferred date</span>
            <input
              name="preferredDate"
              onChange={handleChange}
              type="date"
              value={form.preferredDate || ''}
            />
          </label>

          <label className="form-field">
            <span>Start time</span>
            <input
              name="preferredStartTime"
              onChange={handleChange}
              type="time"
              value={form.preferredStartTime || ''}
            />
          </label>

          <label className="form-field">
            <span>End time</span>
            <input
              name="preferredEndTime"
              onChange={handleChange}
              type="time"
              value={form.preferredEndTime || ''}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

export default MeetingDetailsFields;
