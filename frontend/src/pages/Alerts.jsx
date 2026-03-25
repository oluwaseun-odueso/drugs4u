import { useState, useEffect, useCallback } from 'react';
import { alerts as api } from '../lib/api';

const severityBadge = (s) => {
  const map = { info: 'badge-info', warning: 'badge-warning', critical: 'badge-danger' };
  return <span className={`badge ${map[s] || 'badge-default'}`}>{s}</span>;
};

const typeBadge = (t) => {
  const map = {
    age_check: '🪪 Age Check',
    low_stock: '📦 Low Stock',
    expiry:    '⏰ Expiry',
    allergy:   '⚠ Allergy',
  };
  return map[t] || t;
};

export default function Alerts() {
  const [data, setData]         = useState([]);
  const [unackOnly, setUnackOnly] = useState(false);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.list(unackOnly ? { unacknowledged: '1' } : {}).then(setData).finally(() => setLoading(false));
  }, [unackOnly]);

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id) => {
    try {
      await api.acknowledge(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const unread = data.filter(a => !+a.was_acknowledged).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p>{unread} unacknowledged alert{unread !== 1 ? 's' : ''}</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type="checkbox" checked={unackOnly} onChange={e => setUnackOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
          Show unacknowledged only
        </label>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Message</th>
                  <th>Customer</th>
                  <th>Medicine</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="icon">✅</div><p>No alerts</p></div></td></tr>
                )}
                {data.map(a => (
                  <tr key={a.alert_id} style={{ background: !+a.was_acknowledged ? '#fffbf0' : undefined }}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.created_at}</td>
                    <td>{typeBadge(a.alert_type)}</td>
                    <td>{severityBadge(a.severity)}</td>
                    <td style={{ maxWidth: 280 }}>{a.message}</td>
                    <td>{a.customer_first ? `${a.customer_first} ${a.customer_last}` : <span className="text-muted">—</span>}</td>
                    <td>{a.medication_name || <span className="text-muted">—</span>}</td>
                    <td>
                      {+a.was_acknowledged
                        ? <span className="badge badge-success">Acknowledged</span>
                        : <button className="btn btn-primary btn-sm" onClick={() => acknowledge(a.alert_id)}>Acknowledge</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
