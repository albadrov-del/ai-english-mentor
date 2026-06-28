import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('create, edit, delete a profile with persistence across reloads', async ({ page }) => {
  await expect(page.getByTestId('empty-hint')).toBeVisible();

  // Create
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill('Josipa');
  await page.getByTestId('profile-level').selectOption('B1');
  await page.getByTestId('profile-interests').fill('water treatment, dramas');
  await page.getByTestId('save-profile').click();

  await expect(page.getByTestId('profile-item').filter({ hasText: 'Josipa' })).toHaveCount(1);

  // Persists across reload
  await page.reload();
  await expect(page.getByTestId('profile-item').filter({ hasText: 'Josipa' })).toHaveCount(1);

  // Edit
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa' }).getByTestId('edit-profile').click();
  await page.getByTestId('profile-name').fill('Josipa M.');
  await page.getByTestId('profile-level').selectOption('B2');
  await page.getByTestId('save-profile').click();
  await expect(page.getByTestId('profile-item').filter({ hasText: 'Josipa M.' })).toHaveCount(1);

  // Select -> conversation placeholder greets the profile
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa M.' }).getByTestId('select-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await expect(page.getByTestId('conversation-greeting')).toContainText('Josipa M.');
  await page.getByTestId('conversation-back').click();

  // Delete (via the editor)
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa M.' }).getByTestId('edit-profile').click();
  await page.getByTestId('delete-profile').click();
  await expect(page.getByTestId('profile-item')).toHaveCount(0);

  // Deletion persists
  await page.reload();
  await expect(page.getByTestId('profile-item')).toHaveCount(0);
});

test('Start conversation button opens the conversation; intro hint tracks profiles (#24)', async ({ page }) => {
  // No profiles yet: empty hint shown, intro hint hidden.
  await expect(page.getByTestId('empty-hint')).toBeVisible();
  await expect(page.getByTestId('list-hint')).toBeHidden();

  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill('Josipa');
  await page.getByTestId('profile-level').selectOption('B1');
  await page.getByTestId('save-profile').click();

  // With a profile: intro hint visible and an explicit Start button on the item.
  await expect(page.getByTestId('list-hint')).toBeVisible();
  const item = page.getByTestId('profile-item').filter({ hasText: 'Josipa' });
  await expect(item.getByTestId('start-profile')).toBeVisible();

  // Clicking Start goes straight to the conversation, greeting the profile.
  await item.getByTestId('start-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await expect(page.getByTestId('conversation-greeting')).toContainText('Josipa');
  await expect(page.getByTestId('avatar')).toBeVisible();
});

test('validation blocks an incomplete profile', async ({ page }) => {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('save-profile').click();
  await expect(page.getByTestId('error-name')).toBeVisible();
  await expect(page.getByTestId('error-level')).toBeVisible();
  await expect(page.getByTestId('screen-editor')).toBeVisible(); // still on the editor, nothing saved
});
