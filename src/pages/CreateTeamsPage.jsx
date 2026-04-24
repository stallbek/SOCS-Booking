import { useState } from 'react';
import { apiRequest } from '../api/api';
import PageHeader from '../components/PageHeader';

function CreateTeamPage() {
  const [form, setForm] = useState({
    courseNumber: '',
    teamName: '',
    description: '',
    maxMembers: 4,
    skills: ''
  });

  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');

    if (!form.courseNumber || !form.teamName || !form.description) {
      setFeedback('Please fill all required fields.');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/teams', 'POST', form);
      setFeedback('Team created!');
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
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        description="Create a team request and let others join."
        eyebrow="Create team"
        title="Start a new team"
      />

      <section className="dashboard-card">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">Team details</p>
            <h2>Create request</h2>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          <label className="form-field">
            <span>Course number</span>
            <input name="courseNumber" value={form.courseNumber} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Team name</span>
            <input name="teamName" value={form.teamName} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Max members</span>
            <input type="number" name="maxMembers" value={form.maxMembers} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Skills</span>
            <input name="skills" value={form.skills} onChange={handleChange} />
          </label>

          {feedback && <div className="auth-notice">{feedback}</div>}

          <button className="button button-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create team'}
          </button>

        </form>

      </section>
    </div>
  );
}

export default CreateTeamPage;
