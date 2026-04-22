import { bookingTypes } from './constants';

function BookingTypeSelector({
  bookingTypeOptions = bookingTypes,
  label = 'Booking types',
  selectedBookingTypeId,
  onSelectBookingType
}) {
  return (
    <section className="booking-type-grid" aria-label={label}>
      {bookingTypeOptions.map((type) => (
        <button
          aria-pressed={type.id === selectedBookingTypeId}
          className={`booking-type-card${type.id === selectedBookingTypeId ? ' booking-type-card-active' : ''}`}
          key={type.id}
          onClick={() => onSelectBookingType(type.id)}
          type="button"
        >
          <div className="booking-type-head">
            <span className="booking-type-label">{type.label}</span>
          </div>
          <h2>{type.title}</h2>
          <p>{type.copy}</p>
        </button>
      ))}
    </section>
  );
}

export default BookingTypeSelector;
