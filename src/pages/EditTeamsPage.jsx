import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/api';
import { useSession } from '../context/SessionContext';
import PageHeader from '../components/PageHeader';

function EditTeamPage() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useSession();
    const [feedback, setFeedback] = useState('');
    const [team, setTeam] = useState(null);
    const [form, setForm] = useState({
        description: '',
        maxMembers: 4,
        skills: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTeam = async () => {
            try {
                const data = await apiRequest(`/teams/${id}`);
                setTeam(data);

                setForm({
                    courseNumber: data.courseNumber,
                    teamName: data.teamName,
                    description: data.description,
                    maxMembers: data.maxMembers,
                    skills: data.skills
                });
            } catch (err) {
                console.error(err);
                navigate('/app/dashboard');
            } finally {
                setLoading(false);
            }
        };

        loadTeam();
    }, [id]);

    useEffect(() => {
       

        if (loading || !team || !currentUser) return;

        const isCreator =
            team.creator?._id?.toString() === currentUser?.id;

        console.log("isCreator:", isCreator);

        if (!isCreator) {
            navigate('/app/dashboard');
        }
    }, [loading, team, currentUser]);

    if (loading || !team || !currentUser) {
        return <div>Loading...</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();


        setFeedback('');

        if (!form.courseNumber || !form.teamName || !form.description) {
            setFeedback('Please fill all required fields.');
            return;
        }

        setLoading(true);

        try {
            await apiRequest(`/teams/${id}`, 'PUT', form);
            setFeedback('Team edited!');
            setForm({
                courseNumber: '',
                teamName: '',
                description: '',
                maxMembers: 4,
                skills: ''
            });
        } catch (err) {
            setFeedback(err.message);
        } finally {
            setLoading(false);
        }
        navigate('/app/teams');

    };

    return (
        <div className="dashboard-page">
            <PageHeader
                description="Edit the details of a team you created."
                eyebrow="Edit team"
                title="Edit an existing team"
            />
            <Link
                        to="/app/teams"
                        className="button button-primary"
                    > View All Teams</Link>

            <section className="dashboard-card">
                <div className="dashboard-card-head">
                    <div>
                        <p className="eyebrow">Team details</p>
                        <h2>Edit team</h2>
                    </div>
                    
                    
                    <Link 
                        to="/app/teams/create"
                        className="button button-primary"
                    > Create a new Team</Link>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>

                    <label className="form-field">
                        <span>Course number</span>
                        <input name="courseNumber" value={form.courseNumber} onChange={e => setForm({ ...form, courseNumber: e.target.value })} />
                    </label>

                    <label className="form-field">
                        <span>Team name</span>
                        <input name="teamName" value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })} />
                    </label>

                    <label className="form-field">
                        <span>Description</span>
                        <textarea name="description" maxLength={200} value={form.description} onChange={e =>
                            setForm({ ...form, description: e.target.value })
                        } />

                    </label>

                    <label className="form-field">
                        <span>Max members</span>
                        <input type="number" name="maxMembers" value={form.maxMembers} onChange={e => setForm({ ...form, maxMembers: e.target.value })} />
                    </label>

                    <label className="form-field">
                        <span>Skills</span>
                        <input name="skills" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
                    </label>
                    {feedback && <div className="auth-notice">{feedback}</div>}

                    <button className="button button-primary" type="submit">Save</button>
                </form>
            </section>
        </div>
    );
}

export default EditTeamPage;