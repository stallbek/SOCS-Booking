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
        <h3>Not ready yet</h3>
        <p>Type 2 is still pending.</p>
      </div>
    </section>
  );
}

export default BookingTypePlaceholder;
