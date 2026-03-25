import { useState } from 'react';
import { customers as api } from '../lib/api';

const EMPTY = {
  title: '', first_name: '', last_name: '', date_of_birth: '',
  address_line1: '', address_line2: '', city: '', postcode: '',
  phone: '', email: '', nhs_number: '', allergies: '', medical_conditions: '',
};

export default function CustomerModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm]     = useState(initial ? { ...initial } : { ...EMPTY });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.update(initial.customer_id, form);
      } else {
        await api.create(form);
      }
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
          <h3>{isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Title</label>
                <select value={form.title} onChange={e => set('title', e.target.value)}>
                  <option value="">—</option>
                  {['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth <span className="req">*</span></label>
                <input type="date" required value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
              <div className="form-group">
                <label>First Name <span className="req">*</span></label>
                <input type="text" required value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Name <span className="req">*</span></label>
                <input type="text" required value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone <span className="req">*</span></label>
                <input type="text" required value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>NHS Number</label>
                <input type="text" value={form.nhs_number} onChange={e => set('nhs_number', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Postcode <span className="req">*</span></label>
                <input type="text" required value={form.postcode} onChange={e => set('postcode', e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Address Line 1 <span className="req">*</span></label>
                <input type="text" required value={form.address_line1} onChange={e => set('address_line1', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Address Line 2</label>
                <input type="text" value={form.address_line2} onChange={e => set('address_line2', e.target.value)} />
              </div>
              <div className="form-group">
                <label>City <span className="req">*</span></label>
                <input type="text" required value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Known Allergies</label>
                <textarea value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="List any known allergies..." />
              </div>
              <div className="form-group full">
                <label>Medical Conditions</label>
                <textarea value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} placeholder="List any relevant medical conditions..." />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
