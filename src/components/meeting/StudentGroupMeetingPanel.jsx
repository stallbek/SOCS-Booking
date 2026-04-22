import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../api/api';
import { useSession } from '../../context/SessionContext';
import { buildDateTime, formatLongDate, formatTimeRange, parseDayKey } from '../../utils/date';
import MeetingVoteOptions from './MeetingVoteOptions';
import {
  getCurrentUserVoteIds,
  getGroupOptionDateKey
} from './utils';

function StudentGroupMeetingPanel() {
  const { currentUser } = useSession();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(() => searchParams.get('groupCode') || '');
  const [group, setGroup] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadGroupMeeting = async (code = inviteCode) => {
    const nextCode = code.trim();

    if (!nextCode) {
      setFeedback('Enter a group invite code.');
      return;
    }

    setLoading(true);
    setFeedback('');

    try {
      const data = await apiRequest(`/meetings/group/${nextCode}`);
      setGroup(data);
      setSelectedOptionIds(getCurrentUserVoteIds(data, currentUser.id));
    } catch (error) {
      setGroup(null);
      setSelectedOptionIds([]);
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const code = searchParams.get('groupCode');

    if (code) {
      setInviteCode(code);
      loadGroupMeeting(code);
    }
  }, []);

  const toggleOption = (optionId) => {
    setSelectedOptionIds((currentIds) => (
      currentIds.includes(optionId)
        ? currentIds.filter((currentId) => currentId !== optionId)
        : [...currentIds, optionId]
    ));
  };

  const submitVote = async () => {
    if (!group?.inviteCode) {
      setFeedback('Load a group meeting first.');
      return;
    }

    if (!selectedOptionIds.length) {
      setFeedback('Choose at least one time option.');
      return;
    }

    setVoting(true);
    setFeedback('');

    try {
      const data = await apiRequest(`/meetings/group/${group.inviteCode}/vote`, 'PATCH', {
        optionIds: selectedOptionIds
      });

      setGroup(data.group);
      setSelectedOptionIds(getCurrentUserVoteIds(data.group, currentUser.id));
      setFeedback('Vote saved.');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setVoting(false);
    }
  };

  const selectedFinalOption = group?.selectedOption;
  const selectedDateKey = selectedFinalOption ? getGroupOptionDateKey(selectedFinalOption) : '';
  const selectedStartAt = selectedFinalOption ? buildDateTime(selectedDateKey, selectedFinalOption.startTime) : '';
  const selectedEndAt = selectedFinalOption ? buildDateTime(selectedDateKey, selectedFinalOption.endTime) : '';

  return (
    <section className="dashboard-card meeting-request-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Type 2</p>
          <h2>Join group meeting</h2>
        </div>
        <span className="availability-form-note">Invite code</span>
      </div>

      <div className="group-invite-row">
        <label className="form-field">
          <span>Invite code</span>
          <input
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="Enter code"
            type="text"
            value={inviteCode}
          />
        </label>

        <button className="button button-primary" disabled={loading} onClick={() => loadGroupMeeting()} type="button">
          {loading ? 'Loading' : 'Load meeting'}
        </button>
      </div>

      {feedback ? <div className="auth-notice">{feedback}</div> : null}

      {group ? (
        <div className="group-meeting-panel">
          <div className="office-hours-preview-card group-meeting-summary">
            <p className="eyebrow">Group meeting</p>
            <h3>{group.title}</h3>
            <p>{group.description || 'No description added.'}</p>
            <p>Owner: {group.owner?.name || 'Owner'}</p>
          </div>

          {group.status === 'finalized' && selectedFinalOption ? (
            <div className="dashboard-empty-state">
              <h3>Final time selected</h3>
              <p>
                {formatLongDate(parseDayKey(selectedDateKey))}, {formatTimeRange(selectedStartAt, selectedEndAt)}
              </p>
            </div>
          ) : (
            <>
              <MeetingVoteOptions
                onToggleOption={toggleOption}
                options={group.timeOptions || []}
                selectedOptionIds={selectedOptionIds}
              />

              <div className="office-hours-footer">
                <p className="office-hours-top-copy">
                  Select every time that works for you. The owner chooses the final meeting time.
                </p>

                <button className="button button-primary availability-submit" disabled={voting} onClick={submitVote} type="button">
                  {voting ? 'Saving' : 'Save vote'}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default StudentGroupMeetingPanel;
