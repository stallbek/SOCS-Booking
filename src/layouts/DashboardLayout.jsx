import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import BrandLink from '../components/BrandLink';
import { useSession } from '../context/SessionContext';

const ownerNavItems = [
  { label: 'Dashboard', to: '/app/dashboard' },
  { label: 'Availability', to: '/app/availability' },
  { label: 'Invitations' }
];

const studentNavItems = [
  { label: 'Dashboard', to: '/app/dashboard' },
  { label: 'Owners', to: '/app/owners' }
];

//Stalbek Ulanbek uulu 261102435

function DashboardLayout() {
  const navigate = useNavigate();
  const { currentUser, logout } = useSession();
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
              <NavLink className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link-active' : ''}`} key={item.label} to={item.to}>
                {item.label}
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
