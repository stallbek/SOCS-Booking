function BookingTypePlaceholder({ bookingType }) {
  return (
    <section className="dashboard-card booking-type-panel">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">{bookingType.label}</p>
          <h2>{bookingType.title}</h2>
        </div>
      </div>

      <div className="booking-type-panel-copy">
        <p>{bookingType.copy}</p>
      </div>

      <div className="dashboard-empty-state booking-type-placeholder">
        <h3>This workflow is not implemented yet</h3>
        <p>
          Keep this button structure for the future Type 1 and Type 2 screens. Type 3 remains the active workflow for now.
        </p>
      </div>
    </section>
  );
}

export default BookingTypePlaceholder;
