import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/api';

function EditTeamPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    description: '',
    maxMembers: 4,
    skills: ''
  });

  useEffect(() => {
    const loadTeam = async () => {
      const data = await apiRequest(`/teams/${id}`);
      setForm({
        description: data.description,
        maxMembers: data.maxMembers,
        skills: data.skills
      });
    };

    loadTeam();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await apiRequest(`/teams/${id}`, 'PUT', form);

    navigate('/app/teams');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />
      <button type="submit">Save</button>
    </form>
  );
}