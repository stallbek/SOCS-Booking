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
          Keep this button structure for the future Type 2 screen. Type 1 requests and Type 3 office hours are active now.
        </p>
      </div>
    </section>
  );
}

export default BookingTypePlaceholder;
