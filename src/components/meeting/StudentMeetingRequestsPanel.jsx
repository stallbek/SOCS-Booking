import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/api';
import MeetingRequestList from './MeetingRequestList';

function StudentMeetingRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const loadRequests = async () => {
    setLoading(true);

    try {
      const data = await apiRequest('/meetings/my-requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setFeedback(error.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <section className="dashboard-card meeting-request-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Type 1</p>
          <h2>Meeting requests</h2>
        </div>
      </div>

      {feedback ? <div className="auth-notice">{feedback}</div> : null}

      {loading ? (
        <div className="dashboard-empty-state">
          <h3>Loading requests</h3>
          <p>Checking your sent meeting requests.</p>
        </div>
      ) : (
        <MeetingRequestList
          emptyCopy="Sent Type 1 requests and their owner responses will appear here."
          emptyTitle="No sent requests"
          requests={requests}
          view="student"
        />
      )}
    </section>
  );
}

export default StudentMeetingRequestsPanel;
