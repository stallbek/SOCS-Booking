//Stalbek Ulanbek uulu 261102435

import { buildDateTime, formatLongDate, formatTimeRange, getDatePart, parseDayKey } from '../../../utils/date';
import {
  getRequestId,
  getRequestPerson,
  normalizeStatus
} from './requestUtils';

function MeetingRequestList({
  actingRequestId = '',
  emptyCopy,
  emptyTitle,
  onAccept,
  onDecline,
  requests,
  view
}) {
  if (!requests.length) {
    return (
      <div className="dashboard-empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyCopy}</p>
      </div>
    );
  }

  return (
    <div className="meeting-list">
      {requests.map((request) => {
        const requestId = getRequestId(request);
        const person = getRequestPerson(request, view);
        const dateKey = getDatePart(request.preferredDate);
        const startAt = buildDateTime(dateKey, request.preferredStartTime);
        const endAt = buildDateTime(dateKey, request.preferredEndTime);
        const requestStatus = request.status || 'pending';
        const isPending = requestStatus === 'pending';

        return (
          <article className="dashboard-event-row meeting-request-row" key={requestId}>
            <div className="dashboard-event-time">
              <strong>{formatTimeRange(startAt, endAt)}</strong>
              <span>{formatLongDate(parseDayKey(dateKey))}</span>
            </div>

            <div className="dashboard-event-main">
              <div className="dashboard-event-head">
                <h3>{view === 'owner' ? `From ${person.name}` : `To ${person.name}`}</h3>
                <span className={`dashboard-badge${isPending ? '' : ' dashboard-badge-muted'}`}>
                  {normalizeStatus(requestStatus)}
                </span>
              </div>

              {person.email ? <p>{person.email}</p> : null}
              <p>{request.message}</p>
            </div>

            <div className="dashboard-event-actions meeting-request-actions">
              {person.email ? (
                <a className="text-link" href={`mailto:${person.email}`}>
                  {view === 'owner' ? 'Email student' : 'Email owner'}
                </a>
              ) : null}

              {view === 'owner' && isPending ? (
                <>
                  <button
                    className="text-link"
                    disabled={actingRequestId === requestId}
                    onClick={() => onAccept(requestId)}
                    type="button"
                  >
                    {actingRequestId === requestId ? 'Working' : 'Accept'}
                  </button>

                  <button
                    className="text-link booking-cancel-button"
                    disabled={actingRequestId === requestId}
                    onClick={() => onDecline(requestId)}
                    type="button"
                  >
                    Decline
                  </button>
                </>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default MeetingRequestList;
