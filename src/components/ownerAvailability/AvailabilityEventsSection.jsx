import { formatTimeRange } from '../../utils/date';

function AvailabilityEventsSection({
  deletingKey,
  groupedEvents,
  loadingSlots,
  onClearSelectedDay,
  onDeleteSeries,
  onDeleteSlot,
  scheduleHeading,
  selectedDayKey,
  seriesCountByGroup
}) {
  return (
    <section className="dashboard-card events-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>{scheduleHeading}</h2>
        </div>

        {selectedDayKey ? (
          <button
            className="text-link dashboard-show-all"
            onClick={onClearSelectedDay}
            type="button"
          >
            Show all
          </button>
        ) : null}
      </div>

      {loadingSlots ? (
        <div className="dashboard-empty-state">
          <h3>Loading</h3>
          <p>Checking your office-hour schedule.</p>
        </div>
      ) : groupedEvents.length ? (
        <div className="dashboard-event-groups">
          {groupedEvents.map((group) => (
            <div className="dashboard-event-group" key={group.dayKey}>
              {!selectedDayKey ? <h3 className="dashboard-group-label">{group.label}</h3> : null}

              <div className="dashboard-event-list">
                {group.items.map((event) => {
                  const seriesCount = seriesCountByGroup.get(event.recurringGroupId) || 0;
                  const hasSeries = Boolean(event.recurringGroupId && seriesCount > 1);
                  const isDeletingSlot = deletingKey === `slot:${event.id}`;
                  const isDeletingSeries = deletingKey === `series:${event.recurringGroupId}`;

                  return (
                    <article className="dashboard-event-row availability-event-row" key={event.id}>
                      <div className="dashboard-event-time">
                        <strong>{formatTimeRange(event.startAt, event.endAt)}</strong>
                        <span>{event.statusLabel}</span>
                      </div>

                      <div className="dashboard-event-main">
                        <div className="dashboard-event-head">
                          <h3>{event.title}</h3>
                          <span className="dashboard-badge">{event.statusLabel}</span>
                        </div>

                        {event.description ? <p>{event.description}</p> : null}
                        <p>{event.note}</p>
                      </div>

                      <div className="dashboard-event-actions availability-actions">
                        {event.bookedEmail ? (
                          <a className="text-link" href={`mailto:${event.bookedEmail}`}>
                            Email student
                          </a>
                        ) : null}

                        <button
                          className="text-link availability-delete"
                          disabled={isDeletingSlot || isDeletingSeries}
                          onClick={() => onDeleteSlot(event.id)}
                          type="button"
                        >
                          {isDeletingSlot ? 'Deleting' : hasSeries ? 'Delete occurrence' : 'Delete'}
                        </button>

                        {hasSeries ? (
                          <button
                            className="text-link availability-delete-series"
                            disabled={isDeletingSeries || isDeletingSlot}
                            onClick={() => onDeleteSeries(event.recurringGroupId)}
                            type="button"
                          >
                            {isDeletingSeries ? 'Deleting series' : 'Delete series'}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <h3>No availability yet</h3>
          <p>Create office-hour availability to begin.</p>
        </div>
      )}
    </section>
  );
}

export default AvailabilityEventsSection;
