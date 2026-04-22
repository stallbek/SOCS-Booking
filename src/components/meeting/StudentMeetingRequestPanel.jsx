import { useState } from 'react';
import { apiRequest } from '../../api/api';
import { getItemId } from '../../utils/bookings';
import NotificationActions from '../NotificationActions';
import MeetingDetailsFields from './MeetingDetailsFields';
import {
  buildMeetingRequestPayload,
  createEmailAction,
  createInitialMeetingRequestForm,
  getMeetingRequestValidationMessage
} from './utils';

function StudentMeetingRequestPanel({ selectedOwner }) {
  const [form, setForm] = useState(() => createInitialMeetingRequestForm());
  const [feedback, setFeedback] = useState('');
  const [noticeActions, setNoticeActions] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (name, value) => {
    setForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    setNoticeActions([]);

    const selectedOwnerId = getItemId(selectedOwner);

    if (!selectedOwnerId) {
      setFeedback('Choose an owner first.');
      return;
    }

    const validationMessage = getMeetingRequestValidationMessage(form);

    if (validationMessage) {
      setFeedback(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const data = await apiRequest(
        '/meetings/request',
        'POST',
        buildMeetingRequestPayload(selectedOwnerId, form)
      );
      const notifyAction = createEmailAction(data.notifyEmail, 'Email owner', 'Meeting request sent');

      setNoticeActions(notifyAction ? [notifyAction] : []);
      setFeedback('Meeting request sent.');
      setForm((currentValues) => ({
        ...currentValues,
        message: ''
      }));
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dashboard-card meeting-request-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Type 1</p>
          <h2>Request a meeting</h2>
        </div>
        <span className="availability-form-note">Owner approval</span>
      </div>

      {selectedOwner ? (
        <p className="dashboard-copy">
          Send a meeting request to {selectedOwner.name}. The booking appears on your dashboard after the owner accepts it.
        </p>
      ) : (
        <p className="dashboard-copy">Choose an owner before sending a meeting request.</p>
      )}

      <form className="office-hours-compose" onSubmit={handleSubmit}>
        <MeetingDetailsFields
          descriptionLabel="Request message"
          descriptionName="message"
          descriptionPlaceholder="Mention the course, topic, or reason for the meeting."
          form={form}
          onFieldChange={handleFieldChange}
          showDateTime
          showTitle={false}
        />

        <div className="office-hours-footer">
          {feedback || noticeActions.length ? (
            <div className="auth-notice">
              {feedback ? <span>{feedback}</span> : null}
              <NotificationActions actions={noticeActions} />
            </div>
          ) : null}

          <button className="button button-primary availability-submit" disabled={saving || !selectedOwner} type="submit">
            {saving ? 'Sending' : 'Send request'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default StudentMeetingRequestPanel;
