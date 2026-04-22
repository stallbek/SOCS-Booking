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
            <button
              aria-pressed={isSelected}
              className={`booking-type-filter-button${isSelected ? ' booking-type-filter-button-active' : ''}`}
              key={option.id}
              onClick={() => onToggleType(option.id)}
              type="button"
            >
              <span className={`booking-type-dot ${option.colorClass}`}></span>
              <span>{option.label}</span>
              <strong>{count}</strong>
            </button>
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
