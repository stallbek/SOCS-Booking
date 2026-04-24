//Stalbek Ulanbek uulu 261102435

function BookingTypeButton({
  active = false,
  colorClass = '',
  count = null,
  description = '',
  onClick,
  title,
  variant = 'card'
}) {
  const className = variant === 'filter'
    ? `booking-type-filter-button${active ? ' booking-type-filter-button-active' : ''}`
    : `booking-type-card${active ? ' booking-type-card-active' : ''}`;

  return (
    <button
      aria-pressed={active}
      className={className}
      onClick={onClick}
      type="button"
    >
      {variant === 'filter' ? (
        <>
          <span className={`booking-type-dot ${colorClass}`}></span>
          <span>{title}</span>
          <strong>{count}</strong>
        </>
      ) : (
        <>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </>
      )}
    </button>
  );
}

export default BookingTypeButton;
