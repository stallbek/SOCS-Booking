import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../../api/api';
import { useFeedback } from '../../../context/FeedbackContext';
import { buildDateTime, formatLongDate, formatTimeRange, getDatePart, parseDayKey } from '../../../utils/date';
import MeetingVoteOptions from './MeetingVoteOptions';
import {
  buildGroupMeetingPayload,
  createGroupMeetingDateCard,
  createGroupMeetingTimeBlock,
  createInitialGroupMeetingForm,
  getGroupMeetingOptionId,
  getGroupMeetingPreview,
  getGroupMeetingShareLink,
  getGroupMeetingValidationMessage,
  getGroupOptionVoteCount,
  getSelectedGroupOptionId,
  getTopVotedGroupOption,
  sortDateCardTimeBlocks
} from './groupMeetingUtils';

function getShareInfo(inviteCode) {
  return {
    code: inviteCode,
    link: getGroupMeetingShareLink(inviteCode)
  };
}

function GroupMeetingPreviewCard({ dateCards }) {
  const previewGroups = useMemo(() => getGroupMeetingPreview(dateCards), [dateCards]);

  return (
    <aside className="office-hours-preview-card group-preview-card">
      <h3>Meeting preview</h3>

      <div className="office-hours-preview-list">
        {previewGroups.length ? previewGroups.map((group) => (
          <div className="office-hours-preview-item" key={group.dateKey}>
            <span>{formatLongDate(parseDayKey(group.dateKey))}</span>
            <strong>{group.options.length} slot{group.options.length === 1 ? '' : 's'}</strong>
          </div>
        )) : (
          <div className="dashboard-empty-state calendar-block-empty">
            <h3>No dates yet</h3>
            <p>Add the first date to start.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function OwnerGroupMeetingPanel() {
  const { notify } = useFeedback();
  const [form, setForm] = useState(() => createInitialGroupMeetingForm());
  const [dateCards, setDateCards] = useState(() => [createGroupMeetingDateCard()]);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [finalizingInviteCode, setFinalizingInviteCode] = useState('');
  const [latestShare, setLatestShare] = useState(null);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);

    try {
      const data = await apiRequest('/meetings/my-groups');
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      setGroups([]);
      notify({ message: error.message, tone: 'error' });
    } finally {
      setLoadingGroups(false);
    }
  }, [notify]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleCopyValue = async (value, successMessage) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard is not available here.');
      }

      await navigator.clipboard.writeText(value);
      notify({ message: successMessage, tone: 'success' });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    }
  };

  const handleFormChange = (name, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleDateChange = (dateCardId, value) => {
    setDateCards((currentDateCards) => currentDateCards.map((dateCard) => (
      dateCard.id === dateCardId
        ? { ...dateCard, date: value }
        : dateCard
    )));
  };

  const handleBlockChange = (dateCardId, timeBlockId, name, value) => {
    setDateCards((currentDateCards) => currentDateCards.map((dateCard) => (
      dateCard.id === dateCardId
        ? {
          ...dateCard,
          timeBlocks: dateCard.timeBlocks.map((timeBlock) => (
            timeBlock.id === timeBlockId
              ? { ...timeBlock, [name]: value }
              : timeBlock
          ))
        }
        : dateCard
    )));
  };

  const handleAddDateCard = () => {
    setDateCards((currentDateCards) => [...currentDateCards, createGroupMeetingDateCard()]);
  };

  const handleRemoveDateCard = (dateCardId) => {
    setDateCards((currentDateCards) => currentDateCards.filter((dateCard) => dateCard.id !== dateCardId));
  };

  const handleAddTimeBlock = (dateCardId) => {
    setDateCards((currentDateCards) => currentDateCards.map((dateCard) => (
      dateCard.id === dateCardId
        ? {
          ...dateCard,
          timeBlocks: [...dateCard.timeBlocks, createGroupMeetingTimeBlock()]
        }
        : dateCard
    )));
  };

  const handleRemoveTimeBlock = (dateCardId, timeBlockId) => {
    setDateCards((currentDateCards) => currentDateCards.map((dateCard) => (
      dateCard.id === dateCardId
        ? {
          ...dateCard,
          timeBlocks: dateCard.timeBlocks.filter((timeBlock) => timeBlock.id !== timeBlockId)
        }
        : dateCard
    )));
  };

  const handleCreateMeeting = async (event) => {
    event.preventDefault();
    setFeedback('');

    const validationMessage = getGroupMeetingValidationMessage(form, dateCards);

    if (validationMessage) {
      setFeedback(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const data = await apiRequest('/meetings/group', 'POST', buildGroupMeetingPayload(form, dateCards));
      const shareInfo = getShareInfo(data.group?.inviteCode || data.inviteCode || '');

      setForm(createInitialGroupMeetingForm());
      setDateCards([createGroupMeetingDateCard()]);
      setLatestShare(shareInfo.code ? shareInfo : null);
      await loadGroups();
      notify({
        message: 'Group meeting created.',
        tone: 'success'
      });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePlaceholder = () => {
    notify({
      message: 'Remove group meeting is view-only for now.',
      tone: 'error'
    });
  };

  const handleDeleteGroupMeeting = async (groupId) => {
    try {
      await apiRequest(`/meetings/group/${groupId}`, 'DELETE');
      await loadGroups();
      notify({
        message: 'Group meeting deleted.',
        tone: 'success'
      });
    } catch (error) {
      notify({
        message: error.message || 'Failed to delete group meeting.',
        tone: 'error'
      })
    }
  };
      
  const handleFinalizeGroup = async (group) => {
    const winningOption = getTopVotedGroupOption(group.timeOptions || []);
    const selectedOptionId = getGroupMeetingOptionId(winningOption);

    if (!selectedOptionId) {
      notify({
        message: 'At least one vote is required before finalizing.',
        tone: 'error'
      });
      return;
    }

    setFinalizingInviteCode(group.inviteCode);

    try {
      await apiRequest(`/meetings/group/${group.inviteCode}/finalize`, 'PATCH', {
        selectedOptionId
      });
      await loadGroups();
      notify({
        message: 'Group meeting finalized.',
        tone: 'success'
      });
    } catch (error) {
      notify({ message: error.message, tone: 'error' });
    } finally {
      setFinalizingInviteCode('');
    }
  };

  const sortedDateCards = useMemo(
    () => dateCards.map(sortDateCardTimeBlocks),
    [dateCards]
  );

  return (
    <>
      <section className="dashboard-card availability-form-card">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">Group meeting</p>
            <h2>Create group meeting</h2>
          </div>
        </div>

        <form className="office-hours-compose" onSubmit={handleCreateMeeting}>
          <div className="calendar-compose-top">
            <label className="form-field office-hours-title-field">
              <span>Title</span>
              <input
                name="title"
                onChange={(event) => handleFormChange(event.target.name, event.target.value)}
                placeholder="Type title"
                type="text"
                value={form.title}
              />
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                name="description"
                onChange={(event) => handleFormChange(event.target.name, event.target.value)}
                placeholder="Optional note for students"
                rows="3"
                value={form.description}
              />
            </label>
          </div>

          <div className="calendar-method-layout">
            <div className="weekly-pattern-panel">
              <div className="weekly-pattern-head">
                <h3>Choose dates and add times inside each date</h3>
              </div>

              <div className="time-block-toolbar">
                <button className="button time-block-add-button" onClick={handleAddDateCard} type="button">
                  <span aria-hidden="true" className="time-block-add-mark">+</span>
                  Add date
                </button>
              </div>

              <div className="group-date-card-list">
                {sortedDateCards.length ? sortedDateCards.map((dateCard) => (
                  <article className="group-date-card" key={dateCard.id}>
                    <div className="group-date-card-head">
                      <label className="form-field">
                        <span>Date</span>
                        <input
                          onChange={(event) => handleDateChange(dateCard.id, event.target.value)}
                          type="date"
                          value={dateCard.date}
                        />
                      </label>

                      <button
                        className="text-link"
                        onClick={() => handleRemoveDateCard(dateCard.id)}
                        type="button"
                      >
                        Remove date
                      </button>
                    </div>

                    <div className="group-date-card-toolbar">
                      <button className="text-link" onClick={() => handleAddTimeBlock(dateCard.id)} type="button">
                        Add time block
                      </button>
                    </div>

                    <div className="calendar-block-list">
                      {dateCard.timeBlocks.length ? dateCard.timeBlocks.map((timeBlock) => (
                        <div className="calendar-block-row group-date-time-row" key={timeBlock.id}>
                          <div className="calendar-block-day-label group-date-time-label">
                            <strong>{dateCard.date ? formatLongDate(parseDayKey(dateCard.date)) : 'Choose a date'}</strong>
                          </div>

                          <input
                            aria-label="Start time"
                            name="startTime"
                            onChange={(event) => handleBlockChange(dateCard.id, timeBlock.id, event.target.name, event.target.value)}
                            type="time"
                            value={timeBlock.startTime}
                          />

                          <span>to</span>

                          <input
                            aria-label="End time"
                            name="endTime"
                            onChange={(event) => handleBlockChange(dateCard.id, timeBlock.id, event.target.name, event.target.value)}
                            type="time"
                            value={timeBlock.endTime}
                          />

                          <button
                            aria-label="Remove time block"
                            className="calendar-block-remove"
                            onClick={() => handleRemoveTimeBlock(dateCard.id, timeBlock.id)}
                            type="button"
                          >
                            X
                          </button>
                        </div>
                      )) : (
                        <div className="dashboard-empty-state calendar-block-empty">
                          <h3>No time blocks yet</h3>
                          <p>Add one or more times for this date.</p>
                        </div>
                      )}
                    </div>
                  </article>
                )) : (
                  <div className="dashboard-empty-state calendar-block-empty">
                    <h3>No dates yet</h3>
                    <p>Add the first date to start the Type 2 meeting.</p>
                  </div>
                )}
              </div>
            </div>

            <GroupMeetingPreviewCard
              dateCards={dateCards}
            />
          </div>

          <div className="office-hours-footer">
            {feedback ? <div className="inline-feedback inline-feedback-error">{feedback}</div> : null}

            <button className="button button-primary availability-submit" disabled={saving} type="submit">
              {saving ? 'Creating' : 'Create meeting'}
            </button>
          </div>

          {latestShare ? (
            <div className="group-share-box">
              <p className="group-share-label">Latest invite</p>
              <strong>{latestShare.code}</strong>
              <div className="group-share-actions">
                <button className="text-link" onClick={() => handleCopyValue(latestShare.code, 'Invite code copied.')} type="button">
                  Copy code
                </button>
                <button className="text-link" onClick={() => handleCopyValue(latestShare.link, 'Invite link copied.')} type="button">
                  Copy link
                </button>
                <a className="text-link" href={latestShare.link}>
                  Open
                </a>
              </div>
            </div>
          ) : null}
        </form>
      </section>

      <section className="dashboard-card booking-type-panel">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">Group meeting</p>
            <h2>Created meetings</h2>
          </div>
        </div>

        {loadingGroups ? (
          <div className="dashboard-empty-state">
            <h3>Loading meetings</h3>
            <p>Checking your Type 2 list.</p>
          </div>
        ) : groups.length ? (
          <div className="group-meeting-owner-list">
            {groups.map((group) => {
              const shareInfo = getShareInfo(group.inviteCode);
              const isFinalized = group.status === 'finalized';
              const winningOption = getTopVotedGroupOption(group.timeOptions || []);
              const winningVoteCount = getGroupOptionVoteCount(winningOption);
              const winningDateLabel = winningOption ? formatLongDate(parseDayKey(getDatePart(winningOption.date))) : '';
              const winningStartAt = winningOption ? buildDateTime(winningOption.date, winningOption.startTime) : '';
              const winningEndAt = winningOption ? buildDateTime(winningOption.date, winningOption.endTime) : '';
              const selectedOptionId = getSelectedGroupOptionId(group);
              const selectedOption = group.selectedOption;
              const selectedDateLabel = selectedOption?.date ? formatLongDate(parseDayKey(getDatePart(selectedOption.date))) : '';
              const selectedStartAt = selectedOption?.date ? buildDateTime(group.selectedOption.date, selectedOption.startTime) : '';
              const selectedEndAt = selectedOption?.date ? buildDateTime(group.selectedOption.date, selectedOption.endTime) : '';
              const isFinalizing = finalizingInviteCode === group.inviteCode;

              return (
                <article className="group-meeting-owner-card" key={group._id}>
                  <div className="dashboard-event-head">
                    <div>
                      <p className="eyebrow">Invite code {group.inviteCode}</p>
                      <h3>{group.title}</h3>
                    </div>
                    <span className={`dashboard-badge${isFinalized ? ' dashboard-badge-muted' : ''}`}>
                      {isFinalized ? 'Finalized' : 'Voting'}
                    </span>
                  </div>

                  <p>{group.description || 'No description added.'}</p>

                  <div className="group-share-actions">
                    {!isFinalized ? (
                      <button
                        className="text-link"
                        disabled={!winningOption || isFinalizing}
                        onClick={() => handleFinalizeGroup(group)}
                        type="button"
                      >
                        {isFinalizing ? 'Finalizing' : winningOption ? 'Finalize top time' : 'No votes yet'}
                      </button>
                    ) : null}

                    <button className="text-link" onClick={() => handleCopyValue(group.inviteCode, 'Invite code copied.')} type="button">
                      Copy code
                    </button>
                    <button className="text-link" onClick={() => handleCopyValue(shareInfo.link, 'Invite link copied.')} type="button">
                      Copy link
                    </button>
                    <button
                      className="text-link booking-cancel-button"
                      onClick={() => handleDeleteGroupMeeting(group._id)}
                      type="button"
                    >
                      Remove group meeting
                    </button>
                  </div>

                  {!isFinalized && winningOption ? (
                    <div className="dashboard-empty-state group-meeting-final-summary">
                      <h3>Top time</h3>
                      <p>
                        {winningDateLabel}, {formatTimeRange(winningStartAt, winningEndAt)}
                        {' '}({winningVoteCount} vote{winningVoteCount === 1 ? '' : 's'})
                      </p>
                    </div>
                  ) : null}

                  {isFinalized && selectedOption ? (
                    <div className="dashboard-empty-state group-meeting-final-summary">
                      <h3>Final time</h3>
                      <p>
                        {selectedDateLabel || 'Selected date'}, {formatTimeRange(selectedStartAt, selectedEndAt)}
                      </p>
                    </div>
                  ) : null}

                  {isFinalized ? (
                    <details className="group-meeting-vote-history">
                      <summary>View votes</summary>
                      <MeetingVoteOptions
                        highlightedOptionId={selectedOptionId}
                        options={group.timeOptions || []}
                        readOnly
                        showReadOnlyLabel={false}
                      />
                    </details>
                  ) : (
                    <MeetingVoteOptions
                      highlightedOptionId={selectedOptionId}
                      options={group.timeOptions || []}
                      readOnly
                      showReadOnlyLabel={false}
                    />
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <h3>No meetings yet</h3>
            <p>Create the first Type 2 meeting above.</p>
          </div>
        )}
      </section>
    </>
  );
}

export default OwnerGroupMeetingPanel;
