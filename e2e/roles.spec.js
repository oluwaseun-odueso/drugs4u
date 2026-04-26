/**
 * E2E tests — Role-based access control
 *
 * Verifies that admin sees all nav items and pharmacist cannot
 * access Reports or Inventory (neither via nav nor direct URL).
 */
import { test, expect } from '@playwright/test';
import { login, logout } from './helpers.js';

const ADMIN_NAV     = ['Dashboard', 'Customers', 'Medicines', 'Inventory', 'Prescriptions', 'Reports', 'Alerts'];
const PHARMACIST_NAV = ['Dashboard', 'Customers', 'Medicines', 'Prescriptions', 'Alerts'];
const BLOCKED_NAV    = ['Inventory', 'Reports'];

test.describe('Admin role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin', 'Admin@2026Rx');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  for (const item of ADMIN_NAV) {
    test(`admin sees "${item}" in the sidebar`, async ({ page }) => {
      await expect(page.getByRole('link', { name: item })).toBeVisible();
    });
  }

  test('admin can navigate to Reports', async ({ page }) => {
    await page.getByRole('link', { name: 'Reports' }).click();
    await expect(page).toHaveURL(/\/app\/reports/);
  });

  test('admin can navigate to Inventory', async ({ page }) => {
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page).toHaveURL(/\/app\/inventory/);
  });
});

test.describe('Pharmacist role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'pharmacist', 'Pharm@2026Rx');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  for (const item of PHARMACIST_NAV) {
    test(`pharmacist sees "${item}" in the sidebar`, async ({ page }) => {
      await expect(page.getByRole('link', { name: item })).toBeVisible();
    });
  }

  for (const item of BLOCKED_NAV) {
    test(`pharmacist does NOT see "${item}" in the sidebar`, async ({ page }) => {
      await expect(page.getByRole('link', { name: item })).not.toBeVisible();
    });
  }

  test('pharmacist navigating directly to /app/reports is redirected', async ({ page }) => {
    await page.goto('/app/reports');
    await expect(page).not.toHaveURL(/\/app\/reports/);
  });

  test('pharmacist navigating directly to /app/inventory is redirected', async ({ page }) => {
    await page.goto('/app/inventory');
    await expect(page).not.toHaveURL(/\/app\/inventory/);
  });
});
