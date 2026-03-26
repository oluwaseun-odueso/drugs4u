import { useState, useEffect } from 'react';
import { reports as api } from '../lib/api';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, ResponsiveContainer, Cell,
} from 'recharts';

const today      = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const TEAL   = '#008f9b';
const DARK   = '#004b55';
const DANGER = '#ff5a6b';
const GREEN  = '#22c55e';

const inputStyle = { padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 };
const selectStyle = { ...inputStyle, fontWeight: 600 };

const DATE_RANGE_TYPES  = ['by_date', 'prescriptions', 'by_customer', 'by_stock'];
const SINGLE_DATE_TYPES = ['customers'];

function FlagBadges({ row }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {+row.has_id_check       > 0 && <span className="badge badge-warning" style={{ fontSize: 10 }}>ID Check</span>}
      {+row.has_age_restriction > 0 && <span className="badge badge-warning" style={{ fontSize: 10 }}>Age Restricted</span>}
      {+row.has_controlled_drug > 0 && <span className="badge badge-danger"  style={{ fontSize: 10 }}>Controlled</span>}
    </div>
  );
}

function MedFlagBadges({ row }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {+row.requires_prescription > 0 && <span className="badge badge-info"    style={{ fontSize: 10 }}>Rx</span>}
      {+row.age_restricted        > 0 && <span className="badge badge-warning" style={{ fontSize: 10 }}>Age {row.min_age_years}+</span>}
      {+row.controlled_drug       > 0 && <span className="badge badge-danger"  style={{ fontSize: 10 }}>Controlled</span>}
      {+row.requires_id_check     > 0 && <span className="badge badge-warning" style={{ fontSize: 10 }}>ID Check</span>}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === 'dispensed' ? 'badge-success' : status === 'cancelled' ? 'badge-danger' : 'badge-warning';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function Reports() {
  const [type, setType]     = useState('by_date');
  const [from, setFrom]     = useState(monthStart);
  const [to, setTo]         = useState(today);
  const [date, setDate]     = useState(today);
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const params = { type };
    if (DATE_RANGE_TYPES.includes(type))   { params.date_from = from; params.date_to = to; }
    if (SINGLE_DATE_TYPES.includes(type))  { params.date_from = date; params.date_to = date; }
    api.get(params).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type, from, to, date]);

  const showDateRange  = DATE_RANGE_TYPES.includes(type);
  const showSingleDate = SINGLE_DATE_TYPES.includes(type);

  return (
    <>
      <div className="page-header">
        <div><h1>Reports</h1><p>Prescription, stock and registry analysis</p></div>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
              <option value="by_date">Daily Prescription Summary</option>
              <option value="prescriptions">Detailed Prescriptions</option>
              <option value="by_customer">Prescriptions by Customer</option>
              <option value="by_stock">Stock Usage</option>
              <option value="customers">New Customers</option>
              <option value="inventory">Inventory History</option>
              <option value="medicines">Medicines Catalogue</option>
            </select>

            {showDateRange && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>From</span>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
                <span style={{ color: 'var(--text-muted)' }}>To</span>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
              </>
            )}

            {showSingleDate && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>Date</span>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      {!loading && data.length > 0 && type === 'by_date' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Prescription Activity</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="right" dataKey="total_items_dispensed" name="Items Dispensed" fill={TEAL} opacity={0.5} />
                <Line yAxisId="left" type="monotone" dataKey="total_prescriptions" name="Prescriptions" stroke={DARK} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && data.length > 0 && type === 'by_stock' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Current Stock Levels</h3>
            {(() => {
              const stockChartData = data.map(r => ({ ...r, current_stock: Number(r.current_stock) }));
              return (
                <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
                  <BarChart data={stockChartData} layout="vertical" margin={{ top: 4, right: 40, left: 120, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="medication_name" tick={{ fontSize: 11 }} width={115} />
                    <Tooltip />
                    <Bar dataKey="current_stock" name="Stock">
                      {stockChartData.map((r, i) => (
                        <Cell key={i} fill={+r.is_low_stock ? DANGER : GREEN} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span><span style={{ color: GREEN }}>■</span> Adequate</span>
              <span><span style={{ color: DANGER }}>■</span> Low stock</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          {loading
            ? <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
            : (
              <>
                {/* Daily Summary */}
                {type === 'by_date' && (
                  <table>
                    <thead><tr><th>Date</th><th>Prescriptions</th><th>Items Dispensed</th></tr></thead>
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

                {/* Detailed Prescriptions */}
                {type === 'prescriptions' && (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th><th>Customer</th><th>NHS No.</th>
                        <th>Doctor</th><th>Dispensed By</th>
                        <th>Items</th><th>Medications</th><th>Flags</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.length === 0 && <tr><td colSpan={9}><div className="empty-state"><div className="icon">📋</div><p>No prescriptions for this period</p></div></td></tr>}
                      {data.map((r, i) => (
                        <tr key={i}>
                          <td style={{ whiteSpace: 'nowrap' }}>{r.prescription_date}</td>
                          <td><strong>{r.first_name} {r.last_name}</strong></td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.nhs_number || '—'}</td>
                          <td>{r.prescribed_by || '—'}</td>
                          <td>{r.dispensed_by || '—'}</td>
                          <td><span className="badge badge-info">{r.item_count}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>{r.medications || '—'}</td>
                          <td><FlagBadges row={r} /></td>
                          <td><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* By Customer */}
                {type === 'by_customer' && (
                  <table>
                    <thead><tr><th>Customer</th><th>NHS Number</th><th>Prescriptions</th><th>Items</th></tr></thead>
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

                {/* Stock Usage */}
                {type === 'by_stock' && (
                  <table>
                    <thead><tr><th>Medicine</th><th>Strength</th><th>Current Stock</th><th>Dispensed (Period)</th><th>Stock Status</th></tr></thead>
                    <tbody>
                      {data.length === 0 && <tr><td colSpan={5}><div className="empty-state"><div className="icon">📦</div><p>No medicines found</p></div></td></tr>}
                      {data.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.medication_name}</strong></td>
                          <td>{r.strength || '—'}</td>
                          <td><span className={`badge ${+r.is_low_stock > 0 ? 'badge-danger' : 'badge-success'}`}>{r.current_stock}</span></td>
                          <td>{r.dispensed_in_period || 0}</td>
                          <td>{+r.is_low_stock > 0 ? <span className="badge badge-danger">Low Stock</span> : <span className="badge badge-success">OK</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* New Customers */}
                {type === 'customers' && (
                  <table>
                    <thead><tr><th>Name</th><th>NHS No.</th><th>Date of Birth</th><th>Phone</th><th>Email</th><th>Postcode</th><th>Registered At</th></tr></thead>
                    <tbody>
                      {data.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="icon">👤</div><p>No customers registered on this date</p></div></td></tr>}
                      {data.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.title ? r.title + ' ' : ''}{r.first_name} {r.last_name}</strong></td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.nhs_number || '—'}</td>
                          <td>{r.date_of_birth || '—'}</td>
                          <td>{r.phone || '—'}</td>
                          <td>{r.email || '—'}</td>
                          <td>{r.postcode || '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.created_at?.replace('T', ' ').slice(0, 16)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Inventory History */}
                {type === 'inventory' && (
                  <table>
                    <thead><tr><th>Medicine</th><th>Batch No.</th><th>Qty</th><th>Expiry Date</th><th>Received</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="icon">📦</div><p>No inventory records</p></div></td></tr>}
                      {data.map((r, i) => (
                        <tr key={i} style={{ background: +r.is_expired > 0 ? '#fff5f5' : undefined }}>
                          <td><strong>{r.medication_name}</strong> {r.strength}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.batch_number}</td>
                          <td><span className={`badge ${+r.is_low_stock > 0 ? 'badge-danger' : 'badge-success'}`}>{r.quantity}</span></td>
                          <td>{r.expiry_date}</td>
                          <td>{r.received_date}</td>
                          <td>
                            {+r.is_expired > 0
                              ? <span className="badge badge-danger">Expired</span>
                              : +r.is_low_stock > 0
                                ? <span className="badge badge-warning">Low Stock</span>
                                : <span className="badge badge-success">OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Medicines Catalogue */}
                {type === 'medicines' && (
                  <table>
                    <thead><tr><th>Medicine</th><th>Generic Name</th><th>Strength</th><th>Form</th><th>Manufacturer</th><th>Stock</th><th>Flags</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.length === 0 && <tr><td colSpan={8}><div className="empty-state"><div className="icon">💊</div><p>No medicines found</p></div></td></tr>}
                      {data.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.medication_name}</strong></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.generic_name || '—'}</td>
                          <td>{r.strength || '—'}</td>
                          <td>{r.form || '—'}</td>
                          <td style={{ fontSize: 12 }}>{r.manufacturer || '—'}</td>
                          <td><span className={`badge ${+r.is_low_stock > 0 ? 'badge-danger' : 'badge-success'}`}>{r.total_stock}</span></td>
                          <td><MedFlagBadges row={r} /></td>
                          <td>{+r.is_low_stock > 0 ? <span className="badge badge-danger">Low Stock</span> : <span className="badge badge-success">OK</span>}</td>
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
