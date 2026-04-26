/**
 * E2E tests — Inventory
 *
 * Covers: admin can view and add batches;
 * pharmacist cannot access the inventory page.
 */
import { test, expect } from '@playwright/test';
import { login, logout } from './helpers.js';

test.describe('Inventory — admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin', 'Admin@2026Rx');
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page).toHaveURL(/\/app\/inventory/);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('inventory page loads with batch table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();
    await expect(page.getByText(/batch/i).first()).toBeVisible();
  });

  test('admin can open Add Batch modal', async ({ page }) => {
    await page.getByRole('button', { name: /add batch/i }).click();
    await expect(page.getByRole('heading', { name: /add.*batch/i })).toBeVisible();
  });

  test('Add Batch modal has required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add batch/i }).click();
    await expect(page.getByText(/medicine/i).first()).toBeVisible();
    await expect(page.getByText(/quantity/i).first()).toBeVisible();
    await expect(page.getByText(/expiry/i)).toBeVisible();
  });

  test('cancel closes Add Batch modal', async ({ page }) => {
    await page.getByRole('button', { name: /add batch/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('heading', { name: /add.*batch/i })).not.toBeVisible();
  });
});

test.describe('Inventory — pharmacist blocked', () => {
  test('pharmacist cannot access inventory page via direct URL', async ({ page }) => {
    await login(page, 'pharmacist', 'Pharm@2026Rx');
    await page.goto('/app/inventory');
    await expect(page).not.toHaveURL(/\/app\/inventory/);
    await logout(page);
  });
});
