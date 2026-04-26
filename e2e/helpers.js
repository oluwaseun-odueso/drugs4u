/**
 * Shared helpers for Playwright E2E tests.
 */

/** Log in as a given user and wait for the dashboard to load. */
export async function login(page, username, password) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/app**');
}

/** Log out via the Sign Out button in the sidebar. */
export async function logout(page) {
  await page.getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL('**/login**');
}
