import { useState, useEffect, useCallback } from 'react';
import { inventory as api, medicines as medApi } from '../lib/api';

function AddBatchModal({ onClose, onSaved }) {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm]   = useState({ medication_id: '', quantity: '', expiry_date: '', low_stock_threshold: 10 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { medApi.list({}).then(setMedicines); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.add(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add Inventory Batch</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Medicine <span className="req">*</span></label>
                <select required value={form.medication_id} onChange={e => set('medication_id', e.target.value)}>
                  <option value="">Select medicine...</option>
                  {medicines.map(m => (
                    <option key={m.medication_id} value={m.medication_id}>{m.medication_name} {m.strength}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity <span className="req">*</span></label>
                <input type="number" required min={0} value={form.quantity} onChange={e => set('quantity', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Expiry Date <span className="req">*</span></label>
                <input type="date" required value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Low Stock Threshold</label>
                <input type="number" min={0} value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add Batch'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.list({}).then(setData).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const isExpired  = (row) => new Date(row.expiry_date) < new Date();
  const isExpiring = (row) => {
    const d = new Date(row.expiry_date);
    const n = new Date();
    n.setDate(n.getDate() + 30);
    return !isExpired(row) && d <= n;
  };

  return (
    <>
      <div className="page-header">
        <div><h1>Inventory</h1><p>{data.length} batches on record</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Batch</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch No.</th>
                  <th>Qty</th>
                  <th>Expiry Date</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state"><div className="icon">📦</div><p>No inventory records</p></div></td></tr>
                )}
                {data.map(item => (
                  <tr key={item.inventory_id} style={{ background: isExpired(item) ? '#fff5f5' : undefined }}>
                    <td><strong>{item.medication_name}</strong> {item.strength}</td>
                    <td style={{ fontFamily: 'monospace' }}>{item.batch_number}</td>
                    <td>
                      <span className={`badge ${+item.is_low_stock ? 'badge-danger' : 'badge-success'}`}>
                        {item.quantity}
                      </span>
                      {+item.is_low_stock > 0 && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)' }}>Low</span>}
                    </td>
                    <td>{item.expiry_date}</td>
                    <td>{item.received_date}</td>
                    <td>
                      {isExpired(item)  && <span className="badge badge-danger">Expired</span>}
                      {isExpiring(item) && <span className="badge badge-warning">Expiring Soon</span>}
                      {!isExpired(item) && !isExpiring(item) && <span className="badge badge-success">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && <AddBatchModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </>
  );
}
