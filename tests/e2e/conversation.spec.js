import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('navigate home -> conversation -> summary -> home', async ({ page }) => {
  await createProfile(page, 'Ana', 'B1');
  await expect(page.getByTestId('screen-home')).toBeVisible();

  // home -> conversation
  await page.getByTestId('profile-item').filter({ hasText: 'Ana' }).getByTestId('select-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await expect(page.getByTestId('conversation-greeting')).toContainText('Ana');

  // conversation -> summary
  await page.getByTestId('end-session').click();
  await expect(page.getByTestId('summary-screen')).toBeVisible();

  // summary -> home
  await page.getByTestId('summary-home').click();
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('sending text shows the user turn and a stubbed reply, then clears the input', async ({ page }) => {
  await createProfile(page, 'Ana', 'B1');
  await page.getByTestId('profile-item').filter({ hasText: 'Ana' }).getByTestId('select-profile').click();

  await page.getByTestId('message-input').fill('Hello mentor');
  await page.getByTestId('send-message').click();

  // Scope by role: the assistant echo also contains "Hello mentor", so a bare
  // getByText('Hello mentor') would match both turns (strict-mode violation).
  const transcript = page.getByTestId('transcript');
  await expect(transcript.locator('[data-role="user"]')).toHaveText('Hello mentor');
  await expect(transcript.locator('[data-role="assistant"]')).toContainText('Echo placeholder');
  await expect(page.getByTestId('message-input')).toHaveValue('');
});
