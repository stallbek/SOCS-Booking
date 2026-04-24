//Stalbek Ulanbek uulu 261102435

import { useState } from 'react';
import { apiRequest } from '../../../api/api';
import { useFeedback } from '../../../context/FeedbackContext';
import { getItemId } from '../../../utils/bookings';
import MeetingDetailsFields from './MeetingDetailsFields';
import {
  buildMeetingRequestPayload,
  createEmailAction,
  createInitialMeetingRequestForm,
  getMeetingRequestValidationMessage
} from './requestUtils';

function StudentMeetingRequestPanel({ selectedOwner }) {
  const { notify } = useFeedback();
  const [form, setForm] = useState(() => createInitialMeetingRequestForm());
  const [validationMessage, setValidationMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const ownerHeading = selectedOwner ? `With ${selectedOwner.name}` : 'With owner';

  const handleFieldChange = (name, value) => {
    setForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationMessage('');

    const selectedOwnerId = getItemId(selectedOwner);

    if (!selectedOwnerId) {
      setValidationMessage('Choose an owner first.');
      return;
    }

    const nextValidationMessage = getMeetingRequestValidationMessage(form);

    if (nextValidationMessage) {
      setValidationMessage(nextValidationMessage);
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

      notify({
        actions: notifyAction ? [notifyAction] : [],
        message: 'Meeting request sent.',
        tone: 'success'
      });
      setForm((currentValues) => ({
        ...currentValues,
        message: ''
      }));
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dashboard-card meeting-request-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Request meeting</p>
          <h2>{ownerHeading}</h2>
        </div>
        <span className="availability-form-note">Owner approval</span>
      </div>

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
          {validationMessage ? (
            <div className="inline-feedback inline-feedback-error">{validationMessage}</div>
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
