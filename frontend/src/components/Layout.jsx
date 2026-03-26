import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { alerts as alertsApi } from '../lib/api';

const NAV = [
  { to: '/app',              label: 'Dashboard',      icon: '⊞', exact: true },
  { to: '/app/customers',    label: 'Customers',      icon: '👥' },
  { to: '/app/medicines',    label: 'Medicines',      icon: '💊' },
  { to: '/app/inventory',    label: 'Inventory',      icon: '📦' },
  { to: '/app/prescriptions',label: 'Prescriptions',  icon: '📋' },
  { to: '/app/reports',      label: 'Reports',        icon: '📊' },
  { to: '/app/alerts',       label: 'Alerts',         icon: '🔔' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const isAdmin           = user?.role === 'admin';
  const visibleNav        = NAV.filter(item => isAdmin || (item.label !== 'Reports' && item.label !== 'Inventory'));
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const load = () =>
      alertsApi.list({ unacknowledged: '1' })
        .then(data => setAlertCount(data.length))
        .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">Rx</div>
            <div>
              <h1>Drugs 4U</h1>
              <p>Prescription Management</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {label === 'Alerts' && alertCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', borderRadius: '20px', fontSize: '11px', padding: '1px 7px', fontWeight: 600 }}>
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="su-av">{initials}</div>
          <div>
            <div className="su-name">{user?.name}</div>
            <div className="su-role">{user?.role}</div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>↩</span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">Pharma4 PMS</div>
          <div className="topbar-right">
            <button className="alert-badge" onClick={() => navigate('/app/alerts')}>
              🔔
              {alertCount > 0 && <span>{alertCount > 9 ? '9+' : alertCount}</span>}
            </button>
            <div className="topbar-user">
              <div className="topbar-avatar">{initials}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
