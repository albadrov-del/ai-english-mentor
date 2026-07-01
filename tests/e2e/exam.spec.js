import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

const openCourse = (page, name) =>
  page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('course-profile').click();

async function answerAll(page, n) {
  for (let i = 0; i < n; i++) {
    // The input auto-disables while grading, so fill() naturally waits for the previous answer.
    await page.getByTestId('message-input').fill('My answer here.');
    await page.getByTestId('send-message').click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));
  await page.reload();
});

test('run the level exam, save the score, and see a comparison on retake (#41)', async ({ page }) => {
  await page.route('**/api/grade', (route) => route.fulfill({ json: { correct: true, note: 'nice' } }));

  await createProfile(page, 'Bea', 'A1');
  await openCourse(page, 'Bea');

  // Placement run.
  await page.getByTestId('start-exam').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await expect(page.getByTestId('transcript')).toContainText('Question 1 of 6');
  await answerAll(page, 6);
  await expect(page.getByTestId('transcript')).toContainText('you scored 6/6');

  // Back on the Course: placement saved, button becomes Retake.
  await page.getByTestId('conversation-back').click();
  await openCourse(page, 'Bea');
  await expect(page.getByTestId('exam-status')).toContainText('Placement 6/6');
  await expect(page.getByTestId('start-exam')).toHaveText('Retake the level test');

  // Retake → shows the start-vs-end comparison.
  await page.getByTestId('start-exam').click();
  await answerAll(page, 6);
  await expect(page.getByTestId('transcript')).toContainText('Start 6/6 → End 6/6');
});
