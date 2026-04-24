import { test, expect, type BrowserContext, type Page } from '@playwright/test';

async function setEnglish(context: BrowserContext) {
  await context.addCookies([
    { name: 'dr-lang', value: 'en', domain: 'localhost', path: '/' },
  ]);
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

test.describe('Password visibility toggles', () => {
  test.beforeEach(async ({ context }) => {
    await setEnglish(context);
  });

  test('login password toggle switches the field type and visible label text', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('#login-password');
    const toggle = page.locator('button[aria-controls="login-password"]');
    const toggleText = toggle.locator('[data-password-toggle-text]');

    await passwordInput.fill('visible-secret-123');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleText).toHaveText('Show');

    await toggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveValue('visible-secret-123');
    await expect(toggleText).toHaveText('Hide');

    await toggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveValue('visible-secret-123');
    await expect(toggleText).toHaveText('Show');
  });

  test('profile password toggles operate independently after login', async ({ page }) => {
    await login(page, 'admin@test.com', 'password123');
    await page.goto('/profile');

    const currentPassword = page.locator('#profile-current-password');
    const newPassword = page.locator('#profile-password');
    const currentToggle = page.locator('button[aria-controls="profile-current-password"]');
    const newToggle = page.locator('button[aria-controls="profile-password"]');
    const currentToggleText = currentToggle.locator('[data-password-toggle-text]');
    const newToggleText = newToggle.locator('[data-password-toggle-text]');

    await currentPassword.fill('password123');
    await newPassword.fill('newpassword456');

    await expect(currentPassword).toHaveAttribute('type', 'password');
    await expect(newPassword).toHaveAttribute('type', 'password');
    await expect(currentToggleText).toHaveText('Show');
    await expect(newToggleText).toHaveText('Show');

    await currentToggle.click();
    await expect(currentPassword).toHaveAttribute('type', 'text');
    await expect(currentPassword).toHaveValue('password123');
    await expect(currentToggleText).toHaveText('Hide');
    await expect(newPassword).toHaveAttribute('type', 'password');
    await expect(newPassword).toHaveValue('newpassword456');
    await expect(newToggleText).toHaveText('Show');

    await newToggle.click();
    await expect(currentPassword).toHaveAttribute('type', 'text');
    await expect(newPassword).toHaveAttribute('type', 'text');
    await expect(currentToggleText).toHaveText('Hide');
    await expect(newToggleText).toHaveText('Hide');

    await currentToggle.click();
    await expect(currentPassword).toHaveAttribute('type', 'password');
    await expect(currentPassword).toHaveValue('password123');
    await expect(currentToggleText).toHaveText('Show');
    await expect(newPassword).toHaveAttribute('type', 'text');
    await expect(newPassword).toHaveValue('newpassword456');
    await expect(newToggleText).toHaveText('Hide');

    await newToggle.click();
    await expect(newPassword).toHaveAttribute('type', 'password');
    await expect(newPassword).toHaveValue('newpassword456');
    await expect(newToggleText).toHaveText('Show');
  });

  test('light theme keeps toggle and custom select controls usable in the user form', async ({
    page,
  }) => {
    await login(page, 'admin@test.com', 'password123');
    await page.goto('/profile');

    const html = page.locator('html');
    const themeButton = page.locator('#theme-btn');

    await expect(html).toHaveAttribute('data-theme', 'dark');
    await themeButton.click();
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.goto('/users');
    await expect(html).toHaveAttribute('data-theme', 'light');

    const passwordInput = page.locator('#create-password');
    const passwordToggle = page.locator('button[aria-controls="create-password"]');
    const passwordToggleText = passwordToggle.locator('[data-password-toggle-text]');
    const roleSearch = page.locator('#role-search');
    const roleInput = page.locator('#role-input');
    const organizerOption = page.locator('#role-dropdown .custom-select-option[data-value="organizer"]');
    const suffix = Date.now();

    await page.fill('#create-name', `Toggle Light ${suffix}`);
    await page.fill('#create-email', `toggle-light-${suffix}@test.com`);
    await passwordInput.fill('lightmode123');

    await expect(passwordToggleText).toHaveText('Show');
    await passwordToggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveValue('lightmode123');
    await expect(passwordToggleText).toHaveText('Hide');

    await roleSearch.click();
    await organizerOption.click();
    await expect(roleInput).toHaveValue('organizer');
    await expect(roleSearch).toHaveValue('Organizer');

    await page.locator('form[action="/users"] button[type="submit"]').click();

    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#user-list')).toContainText(`toggle-light-${suffix}@test.com`);
    await expect(page.locator('#user-list')).toContainText(`Toggle Light ${suffix}`);
  });
});
