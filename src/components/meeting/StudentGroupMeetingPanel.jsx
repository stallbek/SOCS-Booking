import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../api/api';
import { useFeedback } from '../../context/FeedbackContext';
import { useSession } from '../../context/SessionContext';
import { buildDateTime, formatLongDate, formatTimeRange, parseDayKey } from '../../utils/date';
import LookupPanel from './LookupPanel';
import MeetingVoteOptions from './MeetingVoteOptions';
import {
  getCurrentUserVoteIds,
  getGroupOptionDateKey
} from './utils';

function StudentGroupMeetingPanel() {
  const { currentUser } = useSession();
  const { notify } = useFeedback();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(() => searchParams.get('groupCode') || '');
  const [group, setGroup] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState('');

  const loadGroupMeeting = async (code = inviteCode) => {
    const nextCode = code.trim();

    if (!nextCode) {
      setInlineFeedback('Enter a group invite code.');
      return;
    }

    setLoading(true);
    setInlineFeedback('');

    try {
      const data = await apiRequest(`/meetings/group/${nextCode}`);
      setGroup(data);
      setSelectedOptionIds(getCurrentUserVoteIds(data, currentUser.id));
    } catch (error) {
      setGroup(null);
      setSelectedOptionIds([]);
      notify({ message: error.message, tone: 'error' });
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
      setInlineFeedback('Load a group meeting first.');
      return;
    }

    if (!selectedOptionIds.length) {
      setInlineFeedback('Choose at least one time option.');
      return;
    }

    setVoting(true);
    setInlineFeedback('');

    try {
      const data = await apiRequest(`/meetings/group/${group.inviteCode}/vote`, 'PATCH', {
        optionIds: selectedOptionIds
      });

      setGroup(data.group);
      setSelectedOptionIds(getCurrentUserVoteIds(data.group, currentUser.id));
      notify({ message: 'Vote saved.', tone: 'success' });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setVoting(false);
    }
  };

  const selectedFinalOption = group?.selectedOption;
  const selectedDateKey = selectedFinalOption ? getGroupOptionDateKey(selectedFinalOption) : '';
  const selectedStartAt = selectedFinalOption ? buildDateTime(selectedDateKey, selectedFinalOption.startTime) : '';
  const selectedEndAt = selectedFinalOption ? buildDateTime(selectedDateKey, selectedFinalOption.endTime) : '';

  return (
    <LookupPanel
      actionDisabled={loading}
      actionLabel={loading ? 'Loading' : 'Load'}
      className="group-meeting-card"
      eyebrow="Join group meetings"
      fieldLabel="Invite code"
      heading="Meeting"
      inputType="text"
      onAction={() => loadGroupMeeting()}
      onChange={setInviteCode}
      placeholder="Enter code"
      value={inviteCode}
    >
      {inlineFeedback ? <div className="inline-feedback inline-feedback-error">{inlineFeedback}</div> : null}

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
    </LookupPanel>
  );
}

export default StudentGroupMeetingPanel;
