import { test, expect } from '@playwright/test';

async function openConversation(page, name, level) {
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
  await page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('select-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('End session requests a summary and renders it', async ({ page }) => {
  await page.route('**/api/summary', (route) =>
    route.fulfill({ json: { summary: 'You spoke clearly today! Practice past tense and some new vocabulary.' } }),
  );

  await openConversation(page, 'Ana', 'B1');
  await page.getByTestId('end-session').click();

  await expect(page.getByTestId('summary-screen')).toBeVisible();
  await expect(page.getByTestId('summary-body')).toContainText('Practice past tense');

  await page.getByTestId('summary-home').click();
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('summary falls back gracefully when the request fails', async ({ page }) => {
  await page.route('**/api/summary', (route) => route.fulfill({ status: 502, json: { error: 'boom' } }));

  await openConversation(page, 'Ana', 'B1');
  await page.getByTestId('end-session').click();

  await expect(page.getByTestId('summary-screen')).toBeVisible();
  await expect(page.getByTestId('summary-body')).toContainText(/great work/i);
});
