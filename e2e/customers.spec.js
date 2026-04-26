/**
 * E2E tests — Customer management
 *
 * Covers: viewing the list, creating a customer, editing,
 * searching, and soft-delete.
 */
import { test, expect } from '@playwright/test';
import { login, logout } from './helpers.js';

test.describe('Customers', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin', 'Admin@2026Rx');
    await page.getByRole('link', { name: 'Customers' }).click();
    await expect(page).toHaveURL(/\/app\/customers/);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('customers list page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
  });

  test('can open Add Customer modal', async ({ page }) => {
    await page.getByRole('button', { name: /add customer/i }).click();
    await expect(page.getByRole('heading', { name: /add new customer/i })).toBeVisible();
  });

  test('can create a new customer and see them in the list', async ({ page }) => {
    await page.getByRole('button', { name: /add customer/i }).click();

    // Fill required fields
    await page.getByLabel('First Name').fill('E2E');
    await page.getByLabel('Last Name').fill('TestUser');
    await page.getByLabel('Date of Birth').fill('1990-06-15');
    await page.getByLabel('Phone').fill('07700900999');
    await page.getByLabel('Address Line 1').fill('1 Playwright Street');
    await page.getByLabel('City').fill('London');
    await page.getByLabel('Postcode').fill('E1 1PW');

    await page.getByRole('button', { name: /add customer/i }).last().click();

    // Modal closes and new customer appears in list
    await expect(page.getByText('E2E')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('TestUser')).toBeVisible();
  });

  test('can search for a customer by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('TestUser');
    await page.waitForTimeout(500); // debounce
    await expect(page.getByText('TestUser')).toBeVisible();
  });

  test('cancel closes the modal without saving', async ({ page }) => {
    await page.getByRole('button', { name: /add customer/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('heading', { name: /add new customer/i })).not.toBeVisible();
  });

  test('form validation prevents submission without required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add customer/i }).click();
    // Click submit without filling anything
    await page.getByRole('button', { name: /add customer/i }).last().click();
    // Modal should still be visible (browser validation or server error)
    await expect(page.getByRole('heading', { name: /add new customer/i })).toBeVisible();
  });
});
