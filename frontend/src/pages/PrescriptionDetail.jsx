import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { prescriptions as api } from '../lib/api';

function statusBadge(status) {
  const map = { pending: 'badge-warning', dispensed: 'badge-success', cancelled: 'badge-default' };
  return <span className={`badge ${map[status] || 'badge-default'}`}>{status}</span>;
}

export default function PrescriptionDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    api.get(id)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status) => {
    if (!window.confirm(`Mark prescription #${id} as "${status}"?`)) return;
    setActing(true);
    try {
      await api.updateStatus(id, status);
      navigate('/app/prescriptions');
    } catch (err) {
      setError(err.message);
      setActing(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error)   return <div className="alert alert-danger" style={{ margin: 24 }}>{error}</div>;
  if (!data)   return null;

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/prescriptions')} style={{ marginBottom: 8 }}>← Back</button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Prescription #{data.prescription_id} {statusBadge(data.status)}
          </h1>
          <p>
            {data.prescription_date}
            {data.prescribed_by && <> &middot; Prescribed by <strong>{data.prescribed_by}</strong></>}
            {data.created_by_name && <> &middot; Created by {data.created_by_name}</>}
          </p>
        </div>
        {data.status === 'pending' && (
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={acting} onClick={() => handleStatus('dispensed')}>Dispense</button>
            <button className="btn btn-ghost" disabled={acting} style={{ color: 'var(--accent)' }} onClick={() => handleStatus('cancelled')}>Cancel</button>
          </div>
        )}
      </div>

      {/* ── Patient ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2>Patient</h2></div>
        <div className="card-body">
          <div className="customer-selected-card">
            <div className="customer-selected-inner">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{data.first_name} {data.last_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  DOB: {data.date_of_birth} &middot; Age: {data.customer_age} &middot; NHS: {data.nhs_number || '—'}
                </div>
                {data.allergies && <div className="allergy-tag">⚠ Allergies: {data.allergies}</div>}
              </div>
            </div>
          </div>
          {data.notes && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: 13 }}>
              <strong>Notes:</strong> {data.notes}
            </div>
          )}
        </div>
      </div>

      {/* ── Medicines ────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header"><h2>Medicines</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Strength / Form</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Dosage Instructions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(item => (
                <tr key={item.item_id}>
                  <td>
                    <strong>{item.medication_name}</strong>
                    {+item.controlled_drug   ? <span className="badge badge-danger"  style={{ marginLeft: 6 }}>CD</span>  : null}
                    {+item.requires_id_check ? <span className="badge badge-warning" style={{ marginLeft: 6 }}>ID</span> : null}
                  </td>
                  <td>{item.strength} {item.form}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    #{item.batch_number}<br />exp {item.expiry_date}
                  </td>
                  <td>{item.quantity_dispensed}</td>
                  <td style={{ fontSize: 13 }}>{item.dosage_instructions || <span className="text-muted">—</span>}</td>
                  <td>{statusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
