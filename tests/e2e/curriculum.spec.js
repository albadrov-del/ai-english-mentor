import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

const openLessons = (page, name) =>
  page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('lessons-profile').click();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));
  await page.reload();
});

test('lessons are gated to the profile level, with a Show-all toggle (#35)', async ({ page }) => {
  await createProfile(page, 'Bea', 'B1');
  await openLessons(page, 'Bea');
  await expect(page.getByTestId('screen-curriculum')).toBeVisible();

  // B1 matches travel (A2–B1), pool (B1), dramas (B1) — the B2-only lesson is hidden.
  await expect(page.getByTestId('curriculum-item')).toHaveCount(3);
  await expect(page.getByTestId('curriculum-list')).not.toContainText('Chemicals & equipment');
  await expect(page.getByTestId('curriculum-note')).toContainText('B1');

  // Reveal all six seeded lessons.
  await page.getByTestId('toggle-all-levels').click();
  await expect(page.getByTestId('curriculum-item')).toHaveCount(6);
  await expect(page.getByTestId('curriculum-list')).toContainText('Chemicals & equipment');
});

test('starting a lesson opens with the warm-up and sends tutor context (#26)', async ({ page }) => {
  const bodies = [];
  await page.route('**/api/chat', async (route) => {
    bodies.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ json: { reply: 'Great — tell me more!' } });
  });

  await createProfile(page, 'Josipa', 'B1');
  await openLessons(page, 'Josipa');

  // For a B1 profile the first matching lesson is "Traveling with the family".
  await page.getByTestId('start-lesson').first().click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();

  const assistant = page.getByTestId('transcript').locator('[data-role="assistant"]');
  await expect(assistant.first()).toContainText('How was your last trip');
  expect(bodies).toHaveLength(0); // warm-up is shown locally, no API call yet

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
  await createProfile(page, 'Josipa', 'B1');
  await openLessons(page, 'Josipa');
  await page.getByTestId('start-lesson').first().click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await page.getByTestId('conversation-back').click();

  await page.getByTestId('profile-item').filter({ hasText: 'Josipa' }).getByTestId('history-profile').click();
  await expect(page.getByTestId('history-item')).toContainText('Traveling with the family');
});
