import BookingTypeButton from './BookingTypeButton';
import { bookingTypeOptions } from '../utils/bookings';

function BookingTypeFilter({ countsByType, onSelectAll, onToggleType, selectedTypeIds }) {
  const selectedTypes = new Set(selectedTypeIds);

  return (
    <div className="booking-type-filter" aria-label="Filter bookings by type">
      <div className="booking-type-filter-options">
        {bookingTypeOptions.map((option) => {
          const isSelected = selectedTypes.has(option.id);
          const count = countsByType?.[option.id] || 0;

          return (
            <BookingTypeButton
              active={isSelected}
              colorClass={option.colorClass}
              count={count}
              key={option.id}
              onClick={() => onToggleType(option.id)}
              title={option.filterLabel || option.title}
              variant="filter"
            />
          );
        })}
      </div>

      {!selectedTypeIds.length ? (
        <button className="text-link dashboard-show-all" onClick={onSelectAll} type="button">
          Show all
        </button>
      ) : null}
    </div>
  );
}

export default BookingTypeFilter;
