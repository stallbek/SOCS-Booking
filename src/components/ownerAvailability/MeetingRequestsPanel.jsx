import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/api';
import NotificationActions from '../NotificationActions';
import MeetingRequestList from '../meeting/MeetingRequestList';
import { createEmailAction } from '../meeting/utils';

function MeetingRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [noticeActions, setNoticeActions] = useState([]);
  const [actingRequestId, setActingRequestId] = useState('');

  const loadRequests = async () => {
    setLoading(true);

    try {
      const data = await apiRequest('/meetings/requests');
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

  const handleRequestAction = async (requestId, action) => {
    setFeedback('');
    setNoticeActions([]);
    setActingRequestId(requestId);

    try {
      const data = await apiRequest(`/meetings/request/${requestId}/${action}`, 'PATCH');
      const notifyAction = createEmailAction(
        data.notifyEmail,
        'Email student',
        action === 'accept' ? 'Meeting request accepted' : 'Meeting request declined'
      );

      setNoticeActions(notifyAction ? [notifyAction] : []);
      setFeedback(action === 'accept' ? 'Request accepted and booked.' : 'Request declined.');
      await loadRequests();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setActingRequestId('');
    }
  };

  return (
    <section className="dashboard-card availability-form-card booking-type-panel">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Type 1</p>
          <h2>Meeting requests</h2>
        </div>
        <span className="availability-form-note">Accept or decline</span>
      </div>

      {feedback || noticeActions.length ? (
        <div className="auth-notice">
          {feedback ? <span>{feedback}</span> : null}
          <NotificationActions actions={noticeActions} />
        </div>
      ) : null}

      {loading ? (
        <div className="dashboard-empty-state">
          <h3>Loading requests</h3>
          <p>Checking student meeting requests.</p>
        </div>
      ) : (
        <MeetingRequestList
          actingRequestId={actingRequestId}
          emptyCopy="New Type 1 requests from students will appear here."
          emptyTitle="No meeting requests"
          onAccept={(requestId) => handleRequestAction(requestId, 'accept')}
          onDecline={(requestId) => handleRequestAction(requestId, 'decline')}
          requests={requests}
          view="owner"
        />
      )}
    </section>
  );
}

export default MeetingRequestsPanel;
