import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

const openCourse = (page, name) =>
  page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('course-profile').click();

const finishFirstLesson = async (page) => {
  await page.getByTestId('start-lesson').first().click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await page.getByTestId('finish-lesson').click();
  await expect(page.getByTestId('screen-course')).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));
  await page.reload();
});

test('finishing a lesson marks it complete and raises the % (#40)', async ({ page }) => {
  await createProfile(page, 'Bea', 'A1');
  await openCourse(page, 'Bea');
  await expect(page.getByTestId('course-percent')).toContainText('0%');

  await finishFirstLesson(page);
  await expect(page.getByTestId('course-item').first()).toHaveAttribute('data-complete', 'true');
  await expect(page.getByTestId('course-percent')).toContainText('17%'); // 1/6

  // Persists across a reload.
  await page.reload();
  await openCourse(page, 'Bea');
  await expect(page.getByTestId('course-item').first()).toHaveAttribute('data-complete', 'true');
});

test('Clear progress resets after confirmation (#40)', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await createProfile(page, 'Bea', 'A1');
  await openCourse(page, 'Bea');
  await finishFirstLesson(page);
  await expect(page.getByTestId('course-percent')).toContainText('17%');

  await page.getByTestId('clear-progress').click();
  await expect(page.getByTestId('course-percent')).toContainText('0%');
  await expect(page.getByTestId('course-item').first()).toHaveAttribute('data-complete', 'false');
});

test('progress is separate per level (#40)', async ({ page }) => {
  await createProfile(page, 'Bea', 'A1');
  await openCourse(page, 'Bea');
  await finishFirstLesson(page);
  await expect(page.getByTestId('course-percent')).toContainText('17%');

  // Switch the profile to B1 — its course starts at 0% (A1 progress untouched).
  await page.getByTestId('course-back').click();
  await page.getByTestId('profile-item').filter({ hasText: 'Bea' }).getByTestId('edit-profile').click();
  await page.getByTestId('profile-level').selectOption('B1');
  await page.getByTestId('save-profile').click();
  await openCourse(page, 'Bea');
  await expect(page.getByTestId('course-title')).toContainText('B1');
  await expect(page.getByTestId('course-percent')).toContainText('0%');
});
