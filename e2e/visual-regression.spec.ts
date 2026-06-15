import { test, expect } from '@playwright/test';

test.describe('Visual Regression Baseline', () => {
  // Use the admin account defined in the Makefile
  test.use({ storageState: undefined }); // We'll manually login for simplicity, or we can use a fixture if available

  test.beforeEach(async ({ page }) => {
    // Navigate to login and log in with e2e test admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/');
  });

  test('Dashboard matches snapshot', async ({ page }) => {
    await page.goto('/');
    // Wait for any animations or images
    await page.waitForTimeout(500); 
    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
  });

  test('Occurrences list view matches snapshot', async ({ page }) => {
    await page.goto('/duties');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('occurrences-list.png', { fullPage: true });
  });

  test('Occurrences card view matches snapshot', async ({ page }) => {
    await page.goto('/duties');
    // Click the card view button
    await page.click('button[data-view="card"]');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('occurrences-card.png', { fullPage: true });
  });

  test('Occurrence Form matches snapshot', async ({ page }) => {
    await page.goto('/duties/new');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('occurrence-form.png', { fullPage: true });
  });

  test('Profile matches snapshot', async ({ page }) => {
    // Assuming the first user is ID 1
    await page.goto('/profile/1');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('profile.png', { fullPage: true });
  });

  test('Leaderboard matches snapshot', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('leaderboard.png', { fullPage: true });
  });

  test('Calendar matches snapshot', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('calendar.png', { fullPage: true });
  });

  test('Groups matches snapshot', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('groups.png', { fullPage: true });
  });

  test('Users matches snapshot', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('users.png', { fullPage: true });
  });

  test('Settings matches snapshot', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
  });

  test('Occurrence Detail matches snapshot', async ({ page }) => {
    // Navigate directly to the first seeded occurrence
    await page.goto('/duties/1');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('occurrence-detail.png', { fullPage: true });
  });
});
