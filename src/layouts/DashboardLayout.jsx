import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import BrandLink from '../components/BrandLink';
import OutlineButton from '../components/OutlineButton';
import { useSession } from '../context/SessionContext';

const ownerNavItems = [
  { label: 'Dashboard', to: '/app/dashboard' },
  { label: 'Availability', to: '/app/availability' },
  { label: 'Bookings', to: '/app/owners' }
];

const studentNavItems = [
  { label: 'Dashboard', to: '/app/dashboard' },
  { label: 'Bookings', to: '/app/owners' }
];

//Stalbek Ulanbek uulu 261102435

function DashboardLayout() {
  const navigate = useNavigate();
  const { currentUser, logout, notifications } = useSession();
  const navItems = currentUser.role === 'owner' ? ownerNavItems : studentNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandLink />

        <nav aria-label="Dashboard" className="app-nav">
          {navItems.map((item) => (
            item.to ? (
              <NavLink
                className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link-active' : ''}`}
                key={item.label}
                to={item.to}
              >
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  {item.label}

                  {/* Owner: Availability → incoming requests */}
                  {currentUser.role === 'owner' &&
                    item.label === 'Availability' &&
                    (notifications.owner > 0 )&& (
                      <span className="notif-badge">
                        {notifications.owner}
                      </span>
                    )}

                  {/* Student (and owner-as-sender): My Bookings → responses */}
                  {item.label === 'My Bookings' &&
                    notifications.user > 0 && (
                      <span className="notif-badge">
                        {notifications.user}
                      </span>
                    )}
                </span>
              </NavLink>
            ) : (
              <span className="app-nav-label" key={item.label}>
                {item.label}
              </span>
            )
          ))}
        </nav>

        <div className="app-user-panel">
          <div className="app-user-copy">
            <span className="app-user-role">{currentUser.role === 'owner' ? 'Owner account' : 'Student account'}</span>
            <strong>{currentUser.name}</strong>
          </div>

          <OutlineButton className="app-logout" onClick={handleLogout}>
            Log out
          </OutlineButton>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
