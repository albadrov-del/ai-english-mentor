import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

// Set the access PIN directly in storage (loadPin() reads it live at send time).
async function setPin(page, pin) {
  await page.evaluate((p) => localStorage.setItem('aem.pin.v1', p), pin);
}

async function openConversation(page, name, level) {
  await setPin(page, 'test-pin');
  await createProfile(page, name, level);
  await page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('select-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('navigate home -> conversation -> summary -> home', async ({ page }) => {
  await createProfile(page, 'Ana', 'B1');
  await expect(page.getByTestId('screen-home')).toBeVisible();

  await page.getByTestId('profile-item').filter({ hasText: 'Ana' }).getByTestId('select-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
  await expect(page.getByTestId('conversation-greeting')).toContainText('Ana');

  await page.getByTestId('end-session').click();
  await expect(page.getByTestId('summary-screen')).toBeVisible();

  await page.getByTestId('summary-home').click();
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('sending a message calls the proxy and renders the reply (network mocked)', async ({ page }) => {
  let captured = null;
  await page.route('**/api/chat', async (route) => {
    captured = {
      body: JSON.parse(route.request().postData() || '{}'),
      pin: route.request().headers()['x-app-pin'],
    };
    await route.fulfill({ json: { reply: 'Hello! How are you today?' } });
  });

  await openConversation(page, 'Ana', 'B1');
  await page.getByTestId('message-input').fill('Hi mentor');
  await page.getByTestId('send-message').click();

  const transcript = page.getByTestId('transcript');
  await expect(transcript.locator('[data-role="user"]')).toHaveText('Hi mentor');
  await expect(transcript.locator('[data-role="assistant"]')).toHaveText('Hello! How are you today?');
  await expect(page.getByTestId('message-input')).toHaveValue('');

  // The request carried the PIN + profile + messages, and NO system prompt.
  expect(captured.pin).toBe('test-pin');
  expect(captured.body).toHaveProperty('profile');
  expect(captured.body).not.toHaveProperty('system');
  expect(captured.body.messages.at(-1)).toEqual({ role: 'user', content: 'Hi mentor' });
});

test('keeps multi-turn history across messages', async ({ page }) => {
  const requests = [];
  await page.route('**/api/chat', async (route) => {
    requests.push(JSON.parse(route.request().postData() || '{}').messages);
    await route.fulfill({ json: { reply: `reply ${requests.length}` } });
  });

  await openConversation(page, 'Ana', 'B1');
  const transcript = page.getByTestId('transcript');

  await page.getByTestId('message-input').fill('first');
  await page.getByTestId('send-message').click();
  await expect(transcript.locator('[data-role="assistant"]')).toHaveText('reply 1');

  await page.getByTestId('message-input').fill('second');
  await page.getByTestId('send-message').click();
  await expect(transcript.locator('[data-role="assistant"]').nth(1)).toHaveText('reply 2');

  // The 2nd request carried the full prior history (user1, assistant1, user2).
  expect(requests[1].map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  expect(requests[1][0]).toEqual({ role: 'user', content: 'first' });
});

test('shows an error when the proxy fails (user turn is kept)', async ({ page }) => {
  await page.route('**/api/chat', (route) => route.fulfill({ status: 502, json: { error: 'boom' } }));

  await openConversation(page, 'Ana', 'B1');
  await page.getByTestId('message-input').fill('hello');
  await page.getByTestId('send-message').click();

  await expect(page.getByTestId('chat-error')).toBeVisible();
  await expect(page.getByTestId('transcript').locator('[data-role="user"]')).toHaveText('hello');
});

test('the Settings PIN input persists to storage', async ({ page }) => {
  await page.getByText('Settings', { exact: true }).click(); // open the <details>
  await page.getByTestId('pin-input').fill('my-pin');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('aem.pin.v1'))).toBe('my-pin');
});
