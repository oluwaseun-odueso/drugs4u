/**
 * E2E tests — Reports
 *
 * Covers: admin can view all report types with charts;
 * pharmacist is blocked from the reports page.
 */
import { test, expect } from '@playwright/test';
import { login, logout } from './helpers.js';

test.describe('Reports — admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin', 'Admin@2026Rx');
    await page.getByRole('link', { name: 'Reports' }).click();
    await expect(page).toHaveURL(/\/app\/reports/);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('reports page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
  });

  test('report type selector is visible', async ({ page }) => {
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('date range filters are visible', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();
  });

  test('can switch to By Customer report', async ({ page }) => {
    await page.getByRole('combobox').first().selectOption('by_customer');
    await expect(page.getByText(/customer/i).first()).toBeVisible();
  });

  test('can switch to By Stock report', async ({ page }) => {
    await page.getByRole('combobox').first().selectOption('by_stock');
    await expect(page.getByText(/stock/i).first()).toBeVisible();
  });
});

test.describe('Reports — pharmacist blocked', () => {
  test('pharmacist cannot access reports page via direct URL', async ({ page }) => {
    await login(page, 'pharmacist', 'Pharm@2026Rx');
    await page.goto('/app/reports');
    await expect(page).not.toHaveURL(/\/app\/reports/);
    await logout(page);
  });
});
