// Ananya Krishnakumar 261024261
import { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '../api/api';
import PageHeader from '../components/PageHeader';
import { useSession } from '../context/SessionContext';
import { Link, useNavigate } from 'react-router-dom';

function mapTeamToEvent(team) {
  return {
    id: team._id,
    creator: team.creator?._id || team.creator,
    title: team.teamName,
    subtitle: team.courseNumber,
    description: team.description,
    skills: team.skills || 'None listed',
    members: team.members || [],
    maxMembers: team.maxMembers,
    note: `${team.members?.length || 0}/${team.maxMembers} members`
  };
}

function TeamsPage() {
  const { currentUser, loading } = useSession();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const userId = currentUser?.id?.toString();
  if (loading) {
    return <div>Loading...</div>;
  }

  //console.log("CURRENT USER:", currentUser);
  useEffect(() => {
    if (!currentUser) {
      return <div>Please log in</div>;
    }
    const loadTeams = async () => {
      try {
        const data = await apiRequest('/teams');
        setTeams(Array.isArray(data) ? data : []);
      } catch (err) {
        setFeedback(err.message);
        setTeams([]);
      } finally {
        setTeamsLoading(false);
      }
    };

    loadTeams();
  }, [currentUser]);

  const events = useMemo(
    () => teams.map(mapTeamToEvent),
    [teams]
  );

  const handleJoin = async (id) => {
    try {
      await apiRequest(`/teams/${id}/join`, 'POST');

      setFeedback('Joined team!');

      setTeams((prev) =>
        prev.map((t) =>
          t._id === id
            ? { ...t, members: [...(t.members || []), currentUser] }
            : t
        )
      );
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const handleDelete = async (id) => {
    console.log("Delete hit");
    try {
      await apiRequest(`/teams/${id}`, 'DELETE');
      setTeams(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const handleLeave = async (id) => {
    try {
      await apiRequest(`/teams/${id}/leave`, 'DELETE');

      setFeedback('Left team');
      if (!res.request) {
        setTeams(prev => prev.filter(t => t._id !== id));
        return;
      }

      setTeams(prev =>
        prev.map(t =>
          t._id === id ? res.request : t
        )
      );

    } catch (err) {
      setFeedback(err.message);
    }
  };

  return (

    <div className="dashboard-page">

      <PageHeader
        description="Browse open project teams and join ongoing work."
        eyebrow="Team Finder"
        title="Find or join a team"

      />

      <section className="dashboard-card">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">Teams</p>
            <h2>Open requests</h2>
          </div>

          <Link
            to="/app/teams/create"
            className="button button-primary"
          > Create Team</Link>
        </div>

        {feedback ? (
          <div className="auth-notice">{feedback}</div>
        ) : null}

        {teamsLoading ? (
          <div className="dashboard-empty-state">
            <h3>Loading</h3>
            <p>Fetching teams...</p>
          </div>
        ) : events.length ? (

          <div className="dashboard-event-list">


            {events.map((team) => {
              const isCreator = team.creator?.toString() === userId;
              const isMember = team.members.some(
                m => (m._id || m).toString() === userId
              );
             
              return (
                <article className="dashboard-event-row" key={team.id}>

                  <div className="dashboard-event-main">

                    <div className="dashboard-event-head">
                      <h3>{team.title}</h3>

                      <span className="dashboard-badge">
                        {team.note}
                      </span>
                    </div>

                    <p><strong>{team.subtitle}</strong></p>
                    <p>{team.description}</p>
                    <p>Skills: {team.skills}</p>
                    <p>
                      Members:
                      {team.members.map(m => m.name).join(', ')}
                    </p>
                  </div>
                  <div className="dashboard-event-actions">
                    {!isMember && (
                      <button className="text-link" onClick={() => handleJoin(team.id)}>Join</button>
                    )}

                    {isMember && !isCreator && (
                      <button className="text-link" onClick={() =>
                        setConfirmation({
                          title: "Leave team?",
                          message: "You will be removed from this team.",
                          confirmLabel: "Leave",
                          cancelLabel: "Cancel",
                          tone: "danger",
                          action: () => handleLeave(team.id)
                        })
                      }>Leave</button>
                    )}

                    {isCreator && (
                      <>
                        <button className="text-link" onClick={() => {console.log("Edit Clicked",`/app/teams/edit/${team.id}`);navigate(`/app/teams/edit/${team.id}`)}}>
                          Edit
                        </button>
                        <button className="text-link" onClick={() => {console.log("Delete Clicked");
                          setConfirmation({
                            title: "Delete team?",
                            message: "This action cannot be undone.",
                            confirmLabel: "Delete",
                            cancelLabel: "Cancel",
                            tone: "danger",
                            action: () => handleDelete(team.id)
                          })
                        }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                </article>);
            })}

          </div>

        ) : (
          <div className="dashboard-empty-state">
            <h3>No teams</h3>
            <p>No open requests yet.</p>
          </div>
        )}

      </section>
    </div>
  );
}

export default TeamsPage;
