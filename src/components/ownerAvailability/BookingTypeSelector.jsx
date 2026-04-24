//Stalbek Ulanbek uulu 261102435

import BookingTypeButton from '../BookingTypeButton';
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
        <BookingTypeButton
          active={type.id === selectedBookingTypeId}
          description={type.copy}
          key={type.id}
          onClick={() => onSelectBookingType(type.id)}
          title={type.title}
        />
      ))}
    </section>
  );
}

export default BookingTypeSelector;
