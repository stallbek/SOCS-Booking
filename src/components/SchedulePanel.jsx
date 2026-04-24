import { formatTimeRange } from '../utils/date';

function SchedulePanel({
  actionsClassName = '',
  collapsed = false,
  contentRef = null,
  contentStyle,
  emptyAction = null,
  emptyCopy,
  emptyTitle,
  groupedEvents,
  headerActions = null,
  heading,
  loading = false,
  loadingCopy = 'Loading.',
  loadingTitle = 'Loading',
  onClearSelectedDay,
  onToggleExpanded,
  panelRef = null,
  renderActions,
  renderBody,
  renderTimeMeta,
  rowClassName,
  selectedDayKey,
  showOverflowToggle = false,
  showOverflowToggleLabel = 'Show more'
}) {
  const contentClassName = `schedule-card-content${collapsed ? ' schedule-card-content-collapsed' : ''}`;

  return (
    <section className="dashboard-card events-card" ref={panelRef}>
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>{heading}</h2>
        </div>

        <div className="dashboard-card-actions">
          {selectedDayKey && onClearSelectedDay ? (
            <button
              className="text-link dashboard-show-all"
              onClick={onClearSelectedDay}
              type="button"
            >
              Show all
            </button>
          ) : null}
          {headerActions}
        </div>
      </div>

      {loading ? (
        <div className="dashboard-empty-state">
          <h3>{loadingTitle}</h3>
          <p>{loadingCopy}</p>
        </div>
      ) : groupedEvents.length ? (
        <>
          <div className={contentClassName} ref={contentRef} style={contentStyle}>
            <div className="dashboard-event-groups">
              {groupedEvents.map((group) => (
                <div className="dashboard-event-group" key={group.dayKey}>
                  {!selectedDayKey ? <h3 className="dashboard-group-label">{group.label}</h3> : null}

                  <div className="dashboard-event-list">
                    {group.items.map((event) => {
                      const nextRowClassName = typeof rowClassName === 'function'
                        ? rowClassName(event)
                        : rowClassName || '';
                      const timeMeta = renderTimeMeta ? renderTimeMeta(event) : event.statusLabel;
                      const nextActionsClassName = actionsClassName ? ` ${actionsClassName}` : '';

                      return (
                        <article
                          className={`dashboard-event-row${nextRowClassName ? ` ${nextRowClassName}` : ''}`}
                          key={event.id}
                        >
                          <div className="dashboard-event-time">
                            <strong>{formatTimeRange(event.startAt, event.endAt)}</strong>
                            {timeMeta ? <span>{timeMeta}</span> : null}
                          </div>

                          <div className="dashboard-event-main">
                            {renderBody(event)}
                          </div>

                          <div className={`dashboard-event-actions${nextActionsClassName}`}>
                            {renderActions(event)}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showOverflowToggle && onToggleExpanded ? (
            <button
              className="button button-muted schedule-more-button"
              onClick={onToggleExpanded}
              type="button"
            >
              {showOverflowToggleLabel}
            </button>
          ) : null}
        </>
      ) : (
        <div className="dashboard-empty-state">
          <h3>{emptyTitle}</h3>
          <p>{emptyCopy}</p>
          {emptyAction}
        </div>
      )}
    </section>
  );
}

export default SchedulePanel;
