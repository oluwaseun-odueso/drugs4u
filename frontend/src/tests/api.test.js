/**
 * Unit tests for frontend/src/lib/api.js
 *
 * Tests that API helpers build correct URLs, query strings,
 * and request options without making real HTTP calls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock fetch globally ───────────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data) {
  mockFetch.mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mockError(data, status = 400) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// Re-import after setting fetch mock
let auth, customers, medicines, inventory, prescriptions, alerts, reports, dashboard;

beforeEach(async () => {
  vi.resetModules();
  mockFetch.mockReset();
  // Dynamic import ensures module uses the mocked fetch
  const api = await import('../lib/api.js');
  auth         = api.auth;
  customers    = api.customers;
  medicines    = api.medicines;
  inventory    = api.inventory;
  prescriptions = api.prescriptions;
  alerts       = api.alerts;
  reports      = api.reports;
  dashboard    = api.dashboard;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('auth.login', () => {
  it('sends POST to /api/auth/login with credentials', async () => {
    mockOk({ id: 1, name: 'Admin', role: 'admin' });
    await auth.login({ username: 'admin', password: 'Admin@2026Rx' });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/login');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ username: 'admin', password: 'Admin@2026Rx' });
  });

  it('throws when server returns an error', async () => {
    mockError({ error: 'Invalid username or password' }, 401);
    await expect(auth.login({ username: 'x', password: 'y' })).rejects.toThrow('Invalid username or password');
  });
});

describe('auth.me', () => {
  it('sends GET to /api/auth/me', async () => {
    mockOk({ id: 1, name: 'Admin', role: 'admin' });
    await auth.me();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/me');
    expect(opts.method).toBeUndefined(); // default GET
  });
});

// ── Customers ─────────────────────────────────────────────────────────────────

describe('customers.list', () => {
  it('sends GET to /api/customers with no params', async () => {
    mockOk({ data: [], total: 0 });
    await customers.list({});
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/customers');
  });

  it('appends search param to URL', async () => {
    mockOk({ data: [], total: 0 });
    await customers.list({ search: 'Smith' });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('search=Smith');
  });
});

describe('customers.get', () => {
  it('sends GET with id param', async () => {
    mockOk({ customer_id: 5 });
    await customers.get(5);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('id=5');
  });
});

describe('customers.create', () => {
  it('sends POST with customer data', async () => {
    mockOk({ id: 10, message: 'Customer created' });
    const data = { first_name: 'Jane', last_name: 'Doe' };
    await customers.create(data);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/customers');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toMatchObject(data);
  });
});

describe('customers.update', () => {
  it('sends PUT with id param and updated data', async () => {
    mockOk({ message: 'Customer updated' });
    await customers.update(3, { phone: '07700000001' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('id=3');
    expect(opts.method).toBe('PUT');
  });
});

describe('customers.remove', () => {
  it('sends DELETE with id param', async () => {
    mockOk({ message: 'Customer removed' });
    await customers.remove(7);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('id=7');
    expect(opts.method).toBe('DELETE');
  });
});

// ── Inventory ─────────────────────────────────────────────────────────────────

describe('inventory.add', () => {
  it('sends POST to /api/inventory', async () => {
    mockOk({ id: 1, message: 'Batch added' });
    await inventory.add({ medication_id: 1, quantity: 100, expiry_date: '2030-01-01' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/inventory');
    expect(opts.method).toBe('POST');
  });
});

// ── Reports ───────────────────────────────────────────────────────────────────

describe('reports.get', () => {
  it('appends type and date params to URL', async () => {
    mockOk([]);
    await reports.get({ type: 'by_date', date_from: '2026-01-01', date_to: '2026-01-31' });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('type=by_date');
    expect(url).toContain('date_from=2026-01-01');
    expect(url).toContain('date_to=2026-01-31');
  });
});

// ── Prescriptions ─────────────────────────────────────────────────────────────

describe('prescriptions.updateStatus', () => {
  it('sends PUT with status in body and id as param', async () => {
    mockOk({ message: 'Updated' });
    await prescriptions.updateStatus(4, 'dispensed');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('id=4');
    expect(opts.method).toBe('PUT');
    expect(JSON.parse(opts.body)).toEqual({ status: 'dispensed' });
  });
});
