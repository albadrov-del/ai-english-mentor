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
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));
  await page.reload();
});

test('the lessons screen lists the seeded sessions (#26)', async ({ page }) => {
  await createProfile(page, 'Josipa', 'B2');
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa' }).getByTestId('lessons-profile').click();
  await expect(page.getByTestId('screen-curriculum')).toBeVisible();
  await expect(page.getByTestId('curriculum-item')).toHaveCount(6);
  await page.getByTestId('curriculum-back').click();
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('starting a lesson opens with the warm-up and sends tutor context (#26)', async ({ page }) => {
  const bodies = [];
  await page.route('**/api/chat', async (route) => {
    bodies.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ json: { reply: 'Great — tell me more!' } });
  });

  await createProfile(page, 'Josipa', 'B2');
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa' }).getByTestId('lessons-profile').click();

  // Start the first lesson (Traveling with the family).
  await page.getByTestId('start-lesson').first().click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();

  // The tutor opens with the curriculum warm-up (shown locally, no API call yet).
  const assistant = page.getByTestId('transcript').locator('[data-role="assistant"]');
  await expect(assistant.first()).toContainText('How was your last trip');
  expect(bodies).toHaveLength(0);

  // The learner replies → the request carries the lesson id + phase (structured data, no prompt text).
  await page.getByTestId('message-input').fill('We went to Italy');
  await page.getByTestId('send-message').click();
  await expect(assistant.nth(1)).toHaveText('Great — tell me more!');

  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toHaveProperty('tutor');
  expect(bodies[0].tutor.sessionId).toBe('travel');
  expect(bodies[0].tutor.phase).toBe('warmup');
  expect(bodies[0]).not.toHaveProperty('system');
});

test('a lesson is saved to history tagged with its lesson title (#26)', async ({ page }) => {
  await page.route('**/api/chat', (route) => route.fulfill({ json: { reply: 'ok' } }));
  await createProfile(page, 'Josipa', 'B2');
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa' }).getByTestId('lessons-profile').click();
  await page.getByTestId('start-lesson').first().click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await page.getByTestId('conversation-back').click();

  // The warm-up alone is enough to have saved the lesson; it shows in history by its title.
  await page.getByTestId('profile-item').filter({ hasText: 'Josipa' }).getByTestId('history-profile').click();
  await expect(page.getByTestId('history-item')).toContainText('Traveling with the family');
});
