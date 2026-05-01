import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/api';
import { useFeedback } from '../context/FeedbackContext';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

function BookPage() {
    const { notify } = useFeedback();
    const { inviteCode } = useParams();
    const [slot, setSlot] = useState(null);
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const {currentUser} = useSession();
    const navigate = useNavigate();
    useEffect(() => {
        if (currentUser === null) return;

        if (!currentUser) {
            navigate(`/login?redirect=/booking/${inviteCode}`);
        }
    }, [currentUser, inviteCode, navigate]);

    useEffect(() => {
        const loadSlot = async () => {
            if (!inviteCode) {
                setError('No invite code provided');
                setLoading(false);
                return;
            }
            try {
                const res = await apiRequest(`/slots/public/code/${inviteCode}`);
                setSlot(res.slot);
                setOwner(res.owner);
            } catch (err) {
                notify({ message: err.message, tone: 'error' });
            } finally {
                setLoading(false);
            }
        };

        if (inviteCode) loadSlot();
    }, [inviteCode, notify]);

    const handleBook = async () => {
        try {
            await apiRequest(`/slots/${slot._id}/book`, 'POST');
            notify({ message: 'Booked successfully!', tone: 'success' });
        } catch (err) {
            setError(err.message);
            notify({ message: err.message, tone: 'error' });
        }
    };

    if (loading) {
  return (
    <div className="dashboard-empty-state">
      <h3>Loading</h3>
      <p>Fetching slot details...</p>
    </div>
  );
}
    if (error) return <p>{error}</p>;
    if (!slot) return <div>Invalid invite</div>;



    return (
        <div className="dashboard-page booking-page">
            <div className="dashboard-card">
                <div className="dashboard-card-head">
                    <div>
                        <p className="eyebrow">Booking</p>
                        <h2>{slot.title}</h2>
                    </div>
                </div>

                <div className="dashboard-card-content">
                    <p><strong>Owner:</strong> {owner?.name}</p>
                    <p><strong>Date:</strong> {new Date(slot.date).toDateString()}</p>
                    <p><strong>Time:</strong> {slot.startTime} - {slot.endTime}</p>
                </div>

                <div className="dashboard-card-actions">
                    <button
                        className="button button-primary"
                        onClick={handleBook}
                        disabled={!!slot.bookedBy}
                    >
                        {slot.bookedBy? 'Already booked' : 'Book Slot'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookPage;