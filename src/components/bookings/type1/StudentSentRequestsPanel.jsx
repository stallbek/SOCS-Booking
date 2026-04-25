import { useEffect, useState } from 'react';
import { apiRequest } from '../../../api/api';
import { useFeedback } from '../../../context/FeedbackContext';
import { buildDateTime, formatTimeRange } from '../../../utils/date';

function StudentSentRequestsPanel() {
  const { notify } = useFeedback();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('/meetings/my-requests');
        setRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        notify({ message: error.message, tone: 'error' });
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [notify]);

  if (loading) {
    return (
      <section className="dashboard-card">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">Your Requests</p>
            <h2>Meeting Requests Sent</h2>
          </div>
        </div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </section>
    );
  }

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Your Requests</p>
          <h2>Meeting Requests Sent ({requests.length})</h2>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="dashboard-empty-state">
          <h3>No requests sent</h3>
          <p>Requests you send to owners will appear here.</p>
        </div>
      ) : (
        <div className="dashboard-event-list">
          {requests.map((request) => (
            <article className="dashboard-event-row" key={request._id}>
              <div className="dashboard-event-time">
                <strong>
                  {formatTimeRange(
                    buildDateTime(request.preferredDate, request.preferredStartTime),
                    buildDateTime(request.preferredDate, request.preferredEndTime)
                  )}
                </strong>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                  {new Date(request.preferredDate).toLocaleDateString()}
                </span>
              </div>

              <div className="dashboard-event-main">
                <div className="dashboard-event-head">
                  <h3>Request to {request.toOwner?.name || 'Owner'}</h3>
                  <span className={`dashboard-badge ${
                    request.status === 'accepted' ? 'badge-success' :
                    request.status === 'declined' ? 'badge-error' :
                    'badge-pending'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <p>{request.message}</p>
              </div>

              <div className="dashboard-event-actions">
                <a className="text-link" href={`mailto:${request.toOwner?.email}`}>
                  Email owner
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default StudentSentRequestsPanel;
