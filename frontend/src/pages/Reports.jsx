import { useState, useEffect } from 'react';
import { reports as api } from '../lib/api';

const today    = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function Reports() {
  const [type, setType]     = useState('by_date');
  const [from, setFrom]     = useState(monthStart);
  const [to, setTo]         = useState(today);
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get({ type, date_from: from, date_to: to }).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type, from, to]);

  return (
    <>
      <div className="page-header">
        <div><h1>Reports</h1><p>Prescription and stock analysis</p></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600 }}
            >
              <option value="by_date">Prescriptions by Date</option>
              <option value="by_customer">Prescriptions by Customer</option>
              <option value="by_stock">Stock Usage Report</option>
            </select>
            <span style={{ color: 'var(--text-muted)' }}>From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
            <span style={{ color: 'var(--text-muted)' }}>To</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
            <>
              {type === 'by_date' && (
                <table>
                  <thead>
                    <tr><th>Date</th><th>Prescriptions</th><th>Items Dispensed</th></tr>
                  </thead>
                  <tbody>
                    {data.length === 0 && <tr><td colSpan={3}><div className="empty-state"><div className="icon">📊</div><p>No data for this period</p></div></td></tr>}
                    {data.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td><span className="badge badge-info">{r.total_prescriptions}</span></td>
                        <td>{r.total_items_dispensed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {type === 'by_customer' && (
                <table>
                  <thead>
                    <tr><th>Customer</th><th>NHS Number</th><th>Prescriptions</th><th>Items</th></tr>
                  </thead>
                  <tbody>
                    {data.length === 0 && <tr><td colSpan={4}><div className="empty-state"><div className="icon">📊</div><p>No data for this period</p></div></td></tr>}
                    {data.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.first_name} {r.last_name}</strong></td>
                        <td>{r.nhs_number || '—'}</td>
                        <td><span className="badge badge-info">{r.total_prescriptions}</span></td>
                        <td>{r.total_items}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {type === 'by_stock' && (
                <table>
                  <thead>
                    <tr><th>Medicine</th><th>Strength</th><th>Current Stock</th><th>Dispensed (Period)</th><th>Stock Status</th></tr>
                  </thead>
                  <tbody>
                    {data.length === 0 && <tr><td colSpan={5}><div className="empty-state"><div className="icon">📦</div><p>No medicines found</p></div></td></tr>}
                    {data.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.medication_name}</strong></td>
                        <td>{r.strength || '—'}</td>
                        <td>
                          <span className={`badge ${+r.is_low_stock ? 'badge-danger' : 'badge-success'}`}>
                            {r.current_stock}
                          </span>
                        </td>
                        <td>{r.dispensed_in_period || 0}</td>
                        <td>{+r.is_low_stock ? <span className="badge badge-danger">Low Stock</span> : <span className="badge badge-success">OK</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
