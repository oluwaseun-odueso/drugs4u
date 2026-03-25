import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptions as api } from '../lib/api';

function statusBadge(status) {
  const map = { pending: 'badge-warning', dispensed: 'badge-success', cancelled: 'badge-default' };
  return <span className={`badge ${map[status] || 'badge-default'}`}>{status}</span>;
}

export default function Prescriptions() {
  const navigate = useNavigate();
  const [data, setData]   = useState({ data: [], total: 0, total_pages: 1 });
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.list(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')))
      .then(setData).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Mark prescription #${id} as "${status}"?`)) return;
    try {
      await api.updateStatus(id, status);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div><h1>Prescriptions</h1><p>{data.total} total</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/app/prescriptions/new')}>+ New Prescription</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <select
              value={filters.status}
              onChange={e => setFilter('status', e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
            >
              <option value="">All statuses</option>
              <option>pending</option>
              <option>dispensed</option>
              <option>cancelled</option>
            </select>
            <input
              type="date" value={filters.date_from}
              onChange={e => setFilter('date_from', e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
            />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input
              type="date" value={filters.date_to}
              onChange={e => setFilter('date_to', e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', date_from: '', date_to: '', page: 1 })}>Clear</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Prescribed By</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="icon">📋</div><p>No prescriptions found</p></div></td></tr>
                )}
                {data.data.map(p => (
                  <tr key={p.prescription_id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{p.prescription_id}</td>
                    <td><strong>{p.first_name} {p.last_name}</strong><br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.nhs_number}</span></td>
                    <td>{p.prescription_date}</td>
                    <td>{p.prescribed_by || <span className="text-muted">—</span>}</td>
                    <td><span className="badge badge-info">{p.item_count} item{p.item_count !== 1 ? 's' : ''}</span></td>
                    <td>{statusBadge(p.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/app/prescriptions/${p.prescription_id}`)}>View</button>
                        {p.status === 'pending' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(p.prescription_id, 'dispensed')}>Dispense</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => handleUpdateStatus(p.prescription_id, 'cancelled')}>Cancel</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data.total_pages > 1 && (
          <div className="pagination">
            <button onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1}>‹</button>
            {Array.from({ length: data.total_pages }, (_, i) => i + 1).map(n => (
              <button key={n} className={n === filters.page ? 'active' : ''} onClick={() => setFilters(f => ({ ...f, page: n }))}>{n}</button>
            ))}
            <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={filters.page === data.total_pages}>›</button>
          </div>
        )}
      </div>
    </>
  );
}
