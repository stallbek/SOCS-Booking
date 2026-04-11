import { Navigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import LandingPage from './LandingPage';

function WelcomeRoute({ mode }) {
  const { currentUser } = useSession();

  if (currentUser && mode) {
    return <Navigate replace to="/app/dashboard" />;
  }

  return <LandingPage authMode={mode} />;
}

export default WelcomeRoute;
