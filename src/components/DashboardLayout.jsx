import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import BrandLink from './BrandLink';
import { useSession } from '../context/SessionContext';

const ownerNavItems = ['Dashboard', 'Availability', 'Invitations'];
const studentNavItems = ['Dashboard', 'Bookings', 'Owners'];

function DashboardLayout() {
  const navigate = useNavigate();
  const { currentUser, logout } = useSession();
  const navItems = currentUser.role === 'owner' ? ownerNavItems : studentNavItems;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandLink />

        <nav aria-label="Dashboard" className="app-nav">
          <NavLink className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link-active' : ''}`} to="/app/dashboard">
            {navItems[0]}
          </NavLink>
          {navItems.slice(1).map((item) => (
            <span className="app-nav-label" key={item}>
              {item}
            </span>
          ))}
        </nav>

        <div className="app-user-panel">
          <div className="app-user-copy">
            <span className="app-user-role">{currentUser.role === 'owner' ? 'Owner account' : 'Student account'}</span>
            <strong>{currentUser.name}</strong>
          </div>

          <button className="button button-muted app-logout" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
