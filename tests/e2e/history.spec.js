import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

const openHistory = (page, name) =>
  page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('history-profile').click();

test.beforeEach(async ({ page }) => {
  await page.route('**/api/chat', (route) => route.fulfill({ json: { reply: 'Nice to meet you!' } }));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));
  await page.reload();
});

test('save, reload, continue and delete a conversation (#25)', async ({ page }) => {
  await createProfile(page, 'Josipa', 'B1');

  // History starts empty.
  await openHistory(page, 'Josipa');
  await expect(page.getByTestId('screen-history')).toBeVisible();
  await expect(page.getByTestId('history-empty')).toBeVisible();
  await page.getByTestId('history-back').click();

  // Start a conversation and exchange one turn → it gets saved.
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa' }).getByTestId('start-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await page.getByTestId('message-input').fill('Hello mentor');
  await page.getByTestId('send-message').click();
  await expect(page.getByTestId('transcript').locator('[data-role="assistant"]')).toHaveText('Nice to meet you!');
  await page.getByTestId('conversation-back').click();

  // Listed by its first message.
  await openHistory(page, 'Josipa');
  await expect(page.getByTestId('history-item')).toHaveCount(1);
  await expect(page.getByTestId('history-item')).toContainText('Hello mentor');

  // Persists across a full reload.
  await page.reload();
  await openHistory(page, 'Josipa');
  await expect(page.getByTestId('history-item')).toHaveCount(1);

  // Continue → the prior turns are restored.
  await page.getByTestId('history-continue').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await expect(page.getByTestId('transcript').locator('[data-role="user"]')).toHaveText('Hello mentor');
  await expect(page.getByTestId('transcript').locator('[data-role="assistant"]')).toHaveText('Nice to meet you!');
  await page.getByTestId('conversation-back').click();

  // Delete → back to empty.
  await openHistory(page, 'Josipa');
  await page.getByTestId('history-delete').click();
  await expect(page.getByTestId('history-item')).toHaveCount(0);
  await expect(page.getByTestId('history-empty')).toBeVisible();
});

test('New conversation from the history screen opens a fresh chat (#25)', async ({ page }) => {
  await createProfile(page, 'Ana', 'B1');
  await openHistory(page, 'Ana');
  await page.getByTestId('history-new').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await expect(page.getByTestId('transcript').locator('li')).toHaveCount(0); // empty, fresh session
});
