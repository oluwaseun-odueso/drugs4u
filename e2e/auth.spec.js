/**
 * E2E tests — Authentication
 *
 * Covers: login success, login failure, logout, and
 * redirect-to-login when accessing protected routes unauthenticated.
 */
import { test, expect } from '@playwright/test';
import { login, logout } from './helpers.js';

test.describe('Login', () => {
  test('valid admin credentials redirect to dashboard', async ({ page }) => {
    await login(page, 'admin', 'Admin@2026Rx');
    await expect(page).toHaveURL(/\/app/);
    // Dashboard heading should be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid username or password/i)).toBeVisible();
  });

  test('empty credentials show validation error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // HTML5 required validation or server error — page should stay on /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout redirects to login page', async ({ page }) => {
    await login(page, 'admin', 'Admin@2026Rx');
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user visiting /app is redirected to login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user visiting /app/customers is redirected to login', async ({ page }) => {
    await page.goto('/app/customers');
    await expect(page).toHaveURL(/\/login/);
  });
});
