import { useState } from 'react';
import { customers as api } from '../lib/api';

const ALLERGEN_OPTIONS = [
  'Celery', 'Cereals containing gluten', 'Crustaceans', 'Eggs', 'Fish',
  'Lupin', 'Milk', 'Molluscs', 'Mustard', 'Peanuts', 'Sesame', 'Soybeans',
  'Sulphur dioxide / Sulphites', 'Tree nuts',
  'Pollen', 'Dust mites', 'Animal dander', 'Insect stings (bee / wasp)', 'Latex',
];

const DRUG_ALLERGY_OPTIONS = [
  'Penicillin / Amoxicillin', 'Sulfonamides (Sulfa drugs)', 'Aspirin',
  'Ibuprofen / NSAIDs', 'Naproxen', 'Anticonvulsants', 'Chemotherapy drugs',
  'Contrast dyes', 'Local anaesthetics', 'General anaesthetics', 'ACE Inhibitors', 'Insulin',
];

const CONDITION_OPTIONS = [
  'Asthma', 'Hypertension (high blood pressure)', 'Coronary heart disease',
  'Stroke', 'Arrhythmia', 'Diabetes (Type 1)', 'Diabetes (Type 2)',
  'Thyroid disorder', 'Obesity', 'Arthritis', 'Osteoporosis', 'Back pain',
  'Depression', 'Anxiety', 'Bipolar disorder', 'Dementia',
  'GORD / Acid reflux', 'IBS', 'Eczema', 'Dermatitis',
  'Headaches / Migraines', 'Common cold / Influenza', 'Pneumonia',
];

const EMPTY = {
  title: '', first_name: '', last_name: '', date_of_birth: '',
  address_line1: '', address_line2: '', city: '', postcode: '',
  phone: '', email: '', nhs_number: '',
  allergies: '', drug_allergies: '', medical_conditions: '',
};

// Parses a comma-separated string into { checked: Set, otherText: string }
function parseValue(value, options) {
  if (!value) return { checked: new Set(), otherText: '' };
  const tokens = value.split(', ').map(t => t.trim()).filter(Boolean);
  const optionSet = new Set(options);
  const checked = new Set();
  const others = [];
  for (const t of tokens) {
    if (optionSet.has(t)) checked.add(t);
    else others.push(t);
  }
  return { checked, otherText: others.join(', ') };
}

// Serialises back to comma-separated string
function buildValue(checked, options, otherText) {
  const ordered = options.filter(o => checked.has(o));
  if (otherText.trim()) ordered.push(otherText.trim());
  return ordered.join(', ');
}

function MultiSelectField({ label, options, value, onChange }) {
  const parsed = parseValue(value, options);
  const [checked, setChecked] = useState(parsed.checked);
  const [otherChecked, setOtherChecked] = useState(parsed.otherText !== '');
  const [otherText, setOtherText]       = useState(parsed.otherText);

  const toggle = (opt) => {
    const next = new Set(checked);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    setChecked(next);
    onChange(buildValue(next, options, otherChecked ? otherText : ''));
  };

  const toggleOther = (e) => {
    const on = e.target.checked;
    setOtherChecked(on);
    onChange(buildValue(checked, options, on ? otherText : ''));
  };

  const changeOther = (e) => {
    setOtherText(e.target.value);
    onChange(buildValue(checked, options, e.target.value));
  };

  return (
    <div className="form-group full">
      <label>{label}</label>
      <div style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        maxHeight: 160, overflowY: 'auto', padding: '6px 10px',
        background: '#fff', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {options.map(opt => (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 400, cursor: 'pointer', margin: 0 }}>
            <input type="checkbox" checked={checked.has(opt)} onChange={() => toggle(opt)} style={{ margin: 0 }} />
            {opt}
          </label>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 400, cursor: 'pointer', margin: 0, borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 2 }}>
          <input type="checkbox" checked={otherChecked} onChange={toggleOther} style={{ margin: 0 }} />
          Other
        </label>
      </div>
      {otherChecked && (
        <input
          type="text"
          value={otherText}
          onChange={changeOther}
          placeholder="Describe other..."
          style={{ marginTop: 6 }}
        />
      )}
    </div>
  );
}

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

              <MultiSelectField
                label="Known Allergies"
                options={ALLERGEN_OPTIONS}
                value={form.allergies}
                onChange={v => set('allergies', v)}
              />
              <MultiSelectField
                label="Drug Allergies"
                options={DRUG_ALLERGY_OPTIONS}
                value={form.drug_allergies}
                onChange={v => set('drug_allergies', v)}
              />
              <MultiSelectField
                label="Medical Conditions"
                options={CONDITION_OPTIONS}
                value={form.medical_conditions}
                onChange={v => set('medical_conditions', v)}
              />
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
