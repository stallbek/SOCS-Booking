import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/api';
import { useFeedback } from '../context/FeedbackContext';

function BookPage() {
  const { token } = useParams();
  const { notify } = useFeedback();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest(`/slots/invite/${token}`);
        setData(res);
      } catch (err) {
        notify({ message: err.message, tone: 'error' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleBook = async () => {
    try {
      await apiRequest(`/slots/${data.slot._id}/book`, 'POST');
      notify({ message: 'Booked successfully!', tone: 'success' });
    } catch (err) {
      notify({ message: err.message, tone: 'error' });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Invalid invite</div>;

  const { slot, owner, isAvailable } = data;

  return (
    <div className="booking-page">
      <h2>{slot.title}</h2>
      <p>{owner.name}</p>
      <p>{slot.date}</p>
      <p>{slot.startTime} - {slot.endTime}</p>

      {isAvailable ? (
        <button onClick={handleBook}>
          Book
        </button>
      ) : (
        <p>Already booked</p>
      )}
    </div>
  );
}

export default BookPage;