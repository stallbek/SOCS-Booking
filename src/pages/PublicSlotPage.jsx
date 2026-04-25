import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/api';
import { useFeedback } from '../context/FeedbackContext';
import { buildDateTime, formatTimeRange } from '../utils/date';
import BrandLink from '../components/BrandLink';
import PageHeader from '../components/PageHeader';
import '../styles.css';

function PublicSlotPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const inviteCode = searchParams.get('code');
  
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSlot = async () => {
      if (!inviteCode) {
        setError('No invite code provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await apiRequest(`/slots/public/code/${inviteCode}`);
        setSlot(data.slot);
        setError('');
      } catch (err) {
        setError(err.message || 'Slot not found or no longer available.');
        setSlot(null);
      } finally {
        setLoading(false);
      }
    };

    loadSlot();
  }, [inviteCode]);

  const handleBook = async () => {
    setBooking(true);
    try {
      await apiRequest(`/slots/${slot._id}/book`, 'POST');
      notify({ message: 'Slot booked successfully!', tone: 'success' });
      setTimeout(() => {
        navigate('/login', { state: { redirectTo: '/app/dashboard' } });
      }, 2000);
    } catch (err) {
      notify({ message: err.message || 'Failed to book slot', tone: 'error' });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="site-header">
        <BrandLink />
        <div className="header-actions">
          <Link className="button button-muted" to="/login">
            Log in
          </Link>
          <Link className="button button-primary" to="/register">
            Register
          </Link>
        </div>
      </header>

      <main className="public-slot-page">
        <PageHeader
          eyebrow="Booking"
          title={slot ? 'Book this slot' : 'Slot Booking'}
          copy={slot ? `${slot.title} with ${slot.owner?.name || 'Owner'}` : error || 'Loading...'}
        />

        {loading && (
          <div className="dashboard-card">
            <p>Loading slot details...</p>
          </div>
        )}

        {error && !loading && (
          <div className="dashboard-card">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>Slot Not Found</h3>
              <p>{error}</p>
              <Link className="button button-muted" to="/">
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {slot && !loading && (
          <div className="dashboard-card">
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="eyebrow">Booking Details</p>
                  <h2>{slot.title}</h2>
                </div>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Owner
                    </label>
                    <p>{slot.owner?.name || 'Unknown'}</p>
                    <a href={`mailto:${slot.owner?.email}`} style={{ color: '#0066cc' }}>
                      {slot.owner?.email}
                    </a>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                      When
                    </label>
                    <p>{formatTimeRange(buildDateTime(slot.date, slot.startTime), buildDateTime(slot.date, slot.endTime))}</p>
                  </div>

                  {slot.description && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                        Description
                      </label>
                      <p>{slot.description}</p>
                    </div>
                  )}
                </div>

                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '0.5rem',
                  marginBottom: '2rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>Status:</strong> {slot.bookedBy ? '❌ Already booked' : '✅ Available'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {!slot.bookedBy ? (
                    <>
                      <button
                        onClick={handleBook}
                        disabled={booking}
                        className="button button-primary"
                        style={{ flex: 1 }}
                      >
                        {booking ? 'Booking...' : 'Book This Slot'}
                      </button>
                      <Link 
                        to="/register" 
                        className="button button-outline"
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        Register First
                      </Link>
                    </>
                  ) : (
                    <button 
                      disabled 
                      className="button button-muted"
                      style={{ width: '100%' }}
                    >
                      This slot is already booked
                    </button>
                  )}
                </div>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
                  Need to register or log in to complete your booking.
                  <br />
                  <Link to="/register">Create an account</Link> or <Link to="/login">log in</Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PublicSlotPage;
