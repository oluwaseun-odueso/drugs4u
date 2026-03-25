import { useState, useEffect, useCallback } from 'react';
import { medicines as api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const EMPTY = {
  medication_name: '', generic_name: '', strength: '', form: '', manufacturer: '',
  requires_prescription: 1, age_restricted: 0, min_age_years: '',
  controlled_drug: 0, requires_id_check: 0, low_stock_threshold: 10,
};

function MedicineModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm]     = useState(initial ? { ...initial } : { ...EMPTY });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.update(initial.medication_id, form);
      else        await api.create(form);
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
          <h3>{isEdit ? 'Edit Medicine' : 'Add Medicine'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Medicine Name <span className="req">*</span></label>
                <input type="text" required value={form.medication_name} onChange={e => set('medication_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Generic Name</label>
                <input type="text" value={form.generic_name} onChange={e => set('generic_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Strength</label>
                <input type="text" placeholder="e.g. 500mg" value={form.strength} onChange={e => set('strength', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Form</label>
                <select value={form.form} onChange={e => set('form', e.target.value)}>
                  <option value="">—</option>
                  {['Tablet', 'Capsule', 'Liquid', 'Inhaler', 'Injection', 'Cream', 'Patch', 'Drops'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Manufacturer</label>
                <input type="text" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Low Stock Threshold</label>
                <input type="number" min={0} value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Minimum Age (if restricted)</label>
                <input type="number" min={0} max={120} value={form.min_age_years} onChange={e => set('min_age_years', e.target.value)} />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              {[
                ['requires_prescription', 'Requires Prescription'],
                ['age_restricted',        'Age Restricted'],
                ['controlled_drug',       'Controlled Drug'],
                ['requires_id_check',     'Requires ID Check'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={!!+form[key]}
                    onChange={e => set(key, e.target.checked ? 1 : 0)}
                    style={{ width: 16, height: 16 }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Medicine'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Medicines() {
  const { user }   = useAuth();
  const isAdmin    = user?.role === 'admin';
  const [data, setData]       = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.list({ search }).then(setData).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <div><h1>Medicines</h1><p>{data.length} medicines registered</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Medicine</button>}
      </div>

      <div className="card">
        <div className="card-header">
          <form className="search-bar" onSubmit={e => { e.preventDefault(); load(); }}>
            <input type="text" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
        </div>

        <div className="table-wrap">
          {loading ? <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Generic</th>
                  <th>Strength</th>
                  <th>Form</th>
                  <th>Stock</th>
                  <th>Flags</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="icon">💊</div><p>No medicines found</p></div></td></tr>
                )}
                {data.map(m => (
                  <tr key={m.medication_id}>
                    <td><strong>{m.medication_name}</strong></td>
                    <td>{m.generic_name || '—'}</td>
                    <td>{m.strength || '—'}</td>
                    <td>{m.form || '—'}</td>
                    <td>
                      <span className={`badge ${+m.is_low_stock ? 'badge-danger' : 'badge-success'}`}>
                        {m.total_stock}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {!!+m.requires_id_check  && <span className="badge badge-warning">ID Check</span>}
                        {!!+m.controlled_drug    && <span className="badge badge-danger">Controlled</span>}
                        {!!+m.age_restricted     && <span className="badge badge-info">{m.min_age_years}+</span>}
                      </div>
                    </td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(m)}>Edit</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <MedicineModal
          initial={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}
