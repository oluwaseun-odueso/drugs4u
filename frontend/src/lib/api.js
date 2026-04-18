const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text || 'Unknown error' }; }

  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

const get  = (path, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`${path}${qs ? '?' + qs : ''}`);
};
const post = (path, body)         => request(path, { method: 'POST',   body: JSON.stringify(body) });
const put  = (path, body, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`${path}${qs ? '?' + qs : ''}`, { method: 'PUT', body: JSON.stringify(body) });
};
const del  = (path, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`${path}${qs ? '?' + qs : ''}`, { method: 'DELETE' });
};

// Auth
export const auth = {
  login:  (creds)  => post('/auth/login', creds),
  logout: ()       => post('/auth/logout', {}),
  me:     ()       => get('/auth/me'),
};

// Customers
export const customers = {
  list:   (params) => get('/customers', params),
  get:    (id)     => get('/customers', { id }),
  create: (data)   => post('/customers', data),
  update: (id, data) => put('/customers', data, { id }),
  remove: (id)     => del('/customers', { id }),
};

// Medicines
export const medicines = {
  list:   (params) => get('/medicines', params),
  get:    (id)     => get('/medicines', { id }),
  create: (data)   => post('/medicines', data),
  update: (id, data) => put('/medicines', data, { id }),
  remove: (id)     => del('/medicines', { id }),
};

// Inventory
export const inventory = {
  list:   (params) => get('/inventory', params),
  get:    (id)     => get('/inventory', { id }),
  add:    (data)   => post('/inventory', data),
  update: (id, data) => put('/inventory', data, { id }),
};

// Prescriptions
export const prescriptions = {
  list:   (params) => get('/prescriptions', params),
  get:    (id)     => get('/prescriptions', { id }),
  create: (data)   => post('/prescriptions', data),
  updateStatus: (id, status) => put('/prescriptions', { status }, { id }),
};

// Alerts
export const alerts = {
  list:        (params) => get('/alerts', params),
  acknowledge: (id)     => put('/alerts', {}, { id }),
};

// Reports
export const reports = {
  get: (params) => get('/reports', params),
};

// Dashboard
export const dashboard = {
  get: () => get('/dashboard'),
};
