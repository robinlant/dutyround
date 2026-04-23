import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3992' });

async function setEnglish(context: BrowserContext) {
  await context.addCookies([
    { name: 'dr-lang', value: 'en', domain: 'localhost', path: '/' },
  ]);
}

async function login(page: Page, email: string, password: string) {
  await setEnglish(page.context());
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('form[action="/login"] button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

test('login password toggle switches input type and visible text', async ({ page }) => {
  await setEnglish(page.context());
  await page.goto('/login');

  const passwordInput = page.locator('#login-password');
  const toggle = page.locator('form[action="/login"] [data-password-toggle]');
  const toggleText = toggle.locator('[data-password-toggle-text]');

  await expect(passwordInput).toHaveAttribute('type', 'password');
  await expect(toggleText).toHaveText('Show');

  await toggle.click();

  await expect(passwordInput).toHaveAttribute('type', 'text');
  await expect(toggleText).toHaveText('Hide');
});

test('profile current and new password toggles operate independently', async ({ page }) => {
  await login(page, 'secadmin@test.com', 'password123');
  await page.goto('/profile');

  const currentPassword = page.locator('#profile-current-password');
  const newPassword = page.locator('#profile-password');
  const currentToggle = page.locator('[data-password-toggle][aria-controls="profile-current-password"]');
  const newToggle = page.locator('[data-password-toggle][aria-controls="profile-password"]');

  await expect(currentPassword).toHaveAttribute('type', 'password');
  await expect(newPassword).toHaveAttribute('type', 'password');

  await currentToggle.click();
  await expect(currentPassword).toHaveAttribute('type', 'text');
  await expect(newPassword).toHaveAttribute('type', 'password');

  await newToggle.click();
  await expect(currentPassword).toHaveAttribute('type', 'text');
  await expect(newPassword).toHaveAttribute('type', 'text');

  await currentToggle.click();
  await expect(currentPassword).toHaveAttribute('type', 'password');
  await expect(newPassword).toHaveAttribute('type', 'text');
});

test('password toggle still works in light theme and standard select remains interactable', async ({
  page,
}) => {
  await login(page, 'secadmin@test.com', 'password123');
  await page.goto('/profile');

  const html = page.locator('html');
  const themeButton = page.locator('#theme-btn');
  const currentPassword = page.locator('#profile-current-password');
  const currentToggle = page.locator('[data-password-toggle][aria-controls="profile-current-password"]');
  const currentToggleText = currentToggle.locator('[data-password-toggle-text]');
  const languageSelect = page.locator('select.language-select');

  await themeButton.click();
  await expect(html).toHaveAttribute('data-theme', 'light');

  await currentToggle.click();
  await expect(currentPassword).toHaveAttribute('type', 'text');
  await expect(currentToggleText).toHaveText('Hide');

  await languageSelect.click();
  await languageSelect.selectOption('de');
  await expect(languageSelect).toHaveValue('de');
});
