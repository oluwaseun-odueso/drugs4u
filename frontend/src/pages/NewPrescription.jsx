import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customers as custApi, medicines as medApi, inventory as invApi, prescriptions as prescApi } from '../lib/api';

const EMPTY_ITEM = { medication_id: '', inventory_id: '', quantity: 1, dosage_instructions: '' };

export default function NewPrescription() {
  const navigate = useNavigate();

  const [medicines, setMedicines]     = useState([]);
  const [inventory, setInventory]     = useState([]);
  const [custSearch, setCustSearch]   = useState('');
  const [custResults, setCustResults] = useState([]);
  const [custSearching, setCustSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [prescribedBy, setPrescribedBy] = useState('');
  const [notes, setNotes]               = useState('');
  const [items, setItems]               = useState([{ ...EMPTY_ITEM }]);

  const [alerts, setAlerts] = useState([]);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    medApi.list({}).then(setMedicines).catch(() => {});
    invApi.list({}).then(setInventory).catch(() => {});
  }, []);

  useEffect(() => {
    if (custSearch.length < 2) { setCustResults([]); return; }
    setCustSearching(true);
    const t = setTimeout(() =>
      custApi.list({ search: custSearch })
        .then(r => setCustResults(r.data || []))
        .catch(() => {})
        .finally(() => setCustSearching(false))
    , 300);
    return () => clearTimeout(t);
  }, [custSearch]);

  const inventoryForMed = (medId) =>
    inventory.filter(i => String(i.medication_id) === String(medId) && i.quantity > 0 && new Date(i.expiry_date) > new Date());

  const getMedicine = (medId) => medicines.find(m => String(m.medication_id) === String(medId));

  const setItem = (index, key, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [key]: value };
      if (key === 'medication_id') {
        updated.inventory_id = '';
        const batches = inventoryForMed(value);
        if (batches.length === 1) updated.inventory_id = String(batches[0].inventory_id);
      }
      return updated;
    }));
  };

  const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) { setError('Please select a customer'); return; }
    for (const item of items) {
      if (!item.medication_id || !item.inventory_id) { setError('Please complete all prescription items'); return; }
    }
    setSaving(true);
    setError('');
    setAlerts([]);
    try {
      const result = await prescApi.create({
        customer_id:  selectedCustomer.customer_id,
        prescribed_by: prescribedBy,
        notes,
        items: items.map(it => ({
          medication_id:        parseInt(it.medication_id),
          inventory_id:         parseInt(it.inventory_id),
          quantity:             parseInt(it.quantity),
          dosage_instructions:  it.dosage_instructions,
        })),
      });
      if (result.alerts?.length) {
        setAlerts(result.alerts);
      } else {
        navigate('/app/prescriptions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/prescriptions')} style={{ marginBottom: 8 }}>← Back</button>
          <h1>New Prescription</h1>
        </div>
      </div>

      {/* ── Risk alerts shown after submit ─────────────────────── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {alerts.map((a, i) => (
            <div key={i} className={`alert ${a.level === 'critical' ? 'alert-danger' : 'alert-warning'}`}>
              <strong>{a.level === 'critical' ? '🚨 Critical:' : '⚠ Warning:'}</strong> {a.message}
            </div>
          ))}
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => navigate('/app/prescriptions')}>Acknowledge &amp; Continue</button>
            <button className="btn btn-ghost" onClick={() => setAlerts([])}>Review Prescription</button>
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

          {/* ── Patient ──────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h2>Patient</h2></div>
            <div className="card-body">
              {!selectedCustomer ? (
                <div style={{ position: 'relative', maxWidth: '50%' }}>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <input
                      type="text"
                      placeholder="Search by name, phone or NHS number…"
                      value={custSearch}
                      onChange={e => setCustSearch(e.target.value)}
                      autoComplete="off"
                      style={{ flex: 1, width: 'auto' }}
                    />
                    {custSearching && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Searching…</span>
                    )}
                    {custSearch && !custSearching && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCustSearch(''); setCustResults([]); }}>Clear</button>
                    )}
                  </div>
                  {custResults.length > 0 && (
                    <div className="rx-dropdown">
                      {custResults.map(c => (
                        <div
                          key={c.customer_id}
                          className="rx-dropdown-item"
                          onClick={() => { setSelectedCustomer(c); setCustSearch(''); setCustResults([]); }}
                        >
                          <strong>{c.title} {c.first_name} {c.last_name}</strong>
                          <span className="rx-dropdown-meta">NHS: {c.nhs_number || '—'} &middot; DOB: {c.date_of_birth} &middot; Age: {c.age}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="customer-selected-card">
                  <div className="customer-selected-inner">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {selectedCustomer.title} {selectedCustomer.first_name} {selectedCustomer.last_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        DOB: {selectedCustomer.date_of_birth} &middot; Age: {selectedCustomer.age} &middot; NHS: {selectedCustomer.nhs_number || '—'}
                      </div>
                      {selectedCustomer.allergies && (
                        <div className="allergy-tag">⚠ Allergies: {selectedCustomer.allergies}</div>
                      )}
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>Change</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Prescription Details ─────────────────────────────── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h2>Prescription Details</h2></div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Prescribed By</label>
                  <input type="text" placeholder="Doctor name / GP" value={prescribedBy} onChange={e => setPrescribedBy(e.target.value)} />
                </div>
                <div className="form-group full">
                  <label>Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" rows={2} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Medicines ────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>Medicines</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Medicine</button>
            </div>
            <div className="card-body">
              {items.map((item, i) => {
                const batches = inventoryForMed(item.medication_id);
                const med     = getMedicine(item.medication_id);
                return (
                  <div key={i} className="rx-item-card">
                    <div className="rx-item-header">
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Item {i + 1}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {med?.controlled_drug   ? <span className="badge badge-danger">Controlled Drug</span> : null}
                        {med?.requires_id_check ? <span className="badge badge-warning">ID Required</span>  : null}
                        {items.length > 1 && (
                          <button type="button" className="btn-icon" style={{ color: 'var(--accent)' }} onClick={() => removeItem(i)}>✕</button>
                        )}
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: 12 }}>
                      <div className="form-group">
                        <label>Medicine <span className="req">*</span></label>
                        <select required value={item.medication_id} onChange={e => setItem(i, 'medication_id', e.target.value)}>
                          <option value="">Select medicine…</option>
                          {medicines.map(m => (
                            <option key={m.medication_id} value={m.medication_id}>
                              {m.medication_name} {m.strength}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Batch / Stock <span className="req">*</span></label>
                        <select required value={item.inventory_id} onChange={e => setItem(i, 'inventory_id', e.target.value)} disabled={!item.medication_id}>
                          <option value="">Select batch…</option>
                          {batches.map(b => (
                            <option key={b.inventory_id} value={b.inventory_id}>
                              #{b.batch_number} — {b.quantity} units, exp {b.expiry_date}
                            </option>
                          ))}
                        </select>
                        {item.medication_id && batches.length === 0 && (
                          <span style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, display: 'block' }}>No stock available</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Quantity <span className="req">*</span></label>
                        <div className="qty-stepper">
                          <button type="button" onClick={() => setItem(i, 'quantity', Math.max(1, item.quantity - 1))}>−</button>
                          <input
                            type="number" min={1} required value={item.quantity}
                            onChange={e => setItem(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          />
                          <button type="button" onClick={() => setItem(i, 'quantity', item.quantity + 1)}>+</button>
                        </div>
                      </div>

                      <div className="form-group full">
                        <label>Dosage Instructions</label>
                        <input
                          type="text"
                          placeholder="e.g. Take 1 tablet twice daily with food"
                          value={item.dosage_instructions}
                          onChange={e => setItem(i, 'dosage_instructions', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-between">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/app/prescriptions')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Prescription'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
