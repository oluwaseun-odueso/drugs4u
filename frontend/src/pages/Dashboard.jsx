import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { dashboard } from '../lib/api';

function StatCard({ icon, value, label, iconClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function statusBadge(status) {
  const map = { pending: 'badge-warning', dispensed: 'badge-success', cancelled: 'badge-default' };
  return <span className={`badge ${map[status] || 'badge-default'}`}>{status}</span>;
}

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const navigate             = useNavigate();
  const location             = useLocation();

  useEffect(() => {
    setLoading(true);
    setError('');
    dashboard.get()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [location.pathname]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error)   return <div className="alert alert-danger" style={{ margin: 24 }}>Dashboard API error: <strong>{error}</strong></div>;
  if (!data)   return null;

  const { stats, low_stock_items, recent_prescriptions } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of today&rsquo;s activity</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="👥" value={stats.total_customers}       label="Total Customers"        iconClass="teal" />
        <StatCard icon="📋" value={stats.today_prescriptions}   label="Prescriptions Today"    iconClass="teal" />
        <StatCard icon="⏳" value={stats.pending_prescriptions}  label="Pending Prescriptions"  iconClass="orange" />
        <StatCard icon="🔔" value={stats.unacknowledged_alerts} label="Unread Alerts"           iconClass="pink" />
      </div>

      <div className="two-cols">
        {/* Recent prescriptions */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Prescriptions</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/prescriptions')}>View all</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_prescriptions.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No prescriptions yet</td></tr>
                )}
                {recent_prescriptions.map(p => (
                  <tr key={p.prescription_id} style={{ cursor: 'pointer' }} onClick={() => navigate('/prescriptions')}>
                    <td>#{p.prescription_id}</td>
                    <td>{p.first_name} {p.last_name}</td>
                    <td>{p.prescription_date}</td>
                    <td>{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header">
            <h2>Low Stock Alert</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inventory')}>View all</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_items.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>All stock levels OK</td></tr>
                )}
                {low_stock_items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.medication_name} {item.strength}</td>
                    <td><span className="badge badge-danger">{item.stock}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.low_stock_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
