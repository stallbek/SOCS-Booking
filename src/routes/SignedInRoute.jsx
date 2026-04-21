import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

function SignedInRoute() {

  //get current page location
  const location = useLocation();

  //get session values
  const { currentUser, loading } = useSession();

  //still checking session
  if (loading) {
    return <div>Loading...</div>;
  }

  //if not logged in send user to login page
  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ redirectTo: location.pathname }}
      />
    );
  }

  //user is logged in so show protected page
  return <Outlet />;
}

export default SignedInRoute;
