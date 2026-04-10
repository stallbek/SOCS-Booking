import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

function SignedInRoute() {
  const location = useLocation();
  const { currentUser } = useSession();

  if (!currentUser) {
    return <Navigate replace state={{ redirectTo: location.pathname }} to="/login" />;
  }

  return <Outlet />;
}

export default SignedInRoute;
