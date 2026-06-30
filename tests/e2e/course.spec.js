import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

const openCourse = (page, name) =>
  page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('course-profile').click();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));
  await page.reload();
});

test('the Course lists the profile-level grammar lessons (#8)', async ({ page }) => {
  await createProfile(page, 'Bea', 'A1');
  await openCourse(page, 'Bea');
  await expect(page.getByTestId('screen-course')).toBeVisible();
  await expect(page.getByTestId('course-item')).toHaveCount(6); // A1 seeds
  await expect(page.getByTestId('course-title')).toContainText('A1');
  await page.getByTestId('course-back').click();
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('starting a lesson announces the goal and sends the lesson id; Finish returns to the Course (#8)', async ({ page }) => {
  const bodies = [];
  await page.route('**/api/chat', async (route) => {
    bodies.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ json: { reply: 'Good — go on!' } });
  });

  await createProfile(page, 'Bea', 'A1');
  await openCourse(page, 'Bea');

  await page.getByTestId('start-lesson').first().click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();

  // The tutor opens by stating the goal (shown locally, no API call yet).
  await expect(page.getByTestId('transcript').locator('[data-role="assistant"]').first()).toContainText(
    "Today we'll practice",
  );
  expect(bodies).toHaveLength(0);

  // Replying carries the lesson id (structured data, no prompt text / system field).
  await page.getByTestId('message-input').fill('My name is Bea.');
  await page.getByTestId('send-message').click();
  await expect(page.getByTestId('transcript').locator('[data-role="assistant"]').nth(1)).toHaveText('Good — go on!');
  expect(bodies[0]).toHaveProperty('lesson');
  expect(bodies[0].lesson.lessonId).toBe('a1-1');
  expect(bodies[0]).not.toHaveProperty('system');

  // Finish lesson → back to the Course.
  await page.getByTestId('finish-lesson').click();
  await expect(page.getByTestId('screen-course')).toBeVisible();
});
