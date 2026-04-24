import MeetingRequestList from '../meeting/MeetingRequestList';

function MeetingRequestsPanel({
  actingRequestId = '',
  loading = false,
  onAccept,
  onDecline,
  requests = []
}) {
  return (
    <section className="dashboard-card availability-form-card booking-type-panel">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Type 1</p>
          <h2>Meeting requests</h2>
        </div>
        <span className="availability-form-note">Review</span>
      </div>

      {loading ? (
        <div className="dashboard-empty-state">
          <h3>Loading requests</h3>
          <p>Checking requests.</p>
        </div>
      ) : (
        <MeetingRequestList
          actingRequestId={actingRequestId}
          emptyCopy="New requests appear here."
          emptyTitle="No meeting requests"
          onAccept={onAccept}
          onDecline={onDecline}
          requests={requests}
          view="owner"
        />
      )}
    </section>
  );
}

export default MeetingRequestsPanel;
