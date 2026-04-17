import { Navigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import LandingPage from './LandingPage';

function WelcomeRoute({ mode }) {

  //get session data
  const { currentUser, loading } = useSession();

  //still checking if user has session
  if (loading) {
    return <div>Loading...</div>;
  }

  //if already logged in and trying login/register page
  if (currentUser && mode) {
    return <Navigate to="/app/dashboard" replace />;
  }

  //show landing page
  return <LandingPage authMode={mode} />;
}

export default WelcomeRoute;