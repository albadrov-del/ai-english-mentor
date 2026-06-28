import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

async function openConversation(page, name, level) {
  await createProfile(page, name, level);
  await page.getByTestId('profile-item').filter({ hasText: name }).getByTestId('select-profile').click();
  await expect(page.getByTestId('conversation-screen')).toBeVisible();
}

// Stub the Web Speech API before any page script runs (so app init sees it as supported).
// continuous/interimResults are set by the app on the instance; stop() fires onend like the real API.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecognition {
      constructor() {
        FakeRecognition.last = this;
        this.lang = '';
        this.continuous = false;
        this.interimResults = false;
        this.maxAlternatives = 1;
      }
      start() {
        this.started = true;
      }
      stop() {
        if (this.onend) this.onend();
      }
    }
    window.SpeechRecognition = FakeRecognition;
    window.speechSynthesis = { cancel() {}, speak() {} };
    window.SpeechSynthesisUtterance = function (t) {
      this.text = t;
      this.lang = '';
    };
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('mic button toggles listening, showing the live status indicator (speech stubbed)', async ({ page }) => {
  await openConversation(page, 'Ana', 'B1');

  const micBtn = page.getByTestId('mic-button');
  const status = page.getByTestId('mic-status');
  await expect(micBtn).toBeVisible();
  await expect(micBtn).toHaveAttribute('data-state', 'idle');
  await expect(status).toBeHidden();

  await micBtn.click();
  await expect(micBtn).toHaveAttribute('data-state', 'listening');
  await expect(status).toBeVisible(); // "still listening" indicator

  // continuous capture is configured on the live recognizer
  expect(await page.evaluate(() => window.SpeechRecognition.last.continuous)).toBe(true);
  expect(await page.evaluate(() => window.SpeechRecognition.last.interimResults)).toBe(true);

  await micBtn.click(); // stop -> finalize -> idle
  await expect(micBtn).toHaveAttribute('data-state', 'idle');
  await expect(status).toBeHidden();
});

test('voice settings (voice/rate/pitch) show in the editor and persist (#23)', async ({ page }) => {
  await createProfile(page, 'Ana', 'B1');

  await page.getByTestId('profile-item').filter({ hasText: 'Ana' }).getByTestId('edit-profile').click();
  await expect(page.getByTestId('screen-editor')).toBeVisible();
  await page.getByTestId('voice-settings').evaluate((d) => { d.open = true; });

  // Always at least the "Automatic" voice option; sliders default to 1.
  await expect(page.getByTestId('profile-voice').locator('option').first()).toHaveText('Automatic (best available)');
  const rate = page.getByTestId('profile-rate');
  const pitch = page.getByTestId('profile-pitch');
  await expect(rate).toHaveValue('1');
  await expect(pitch).toHaveValue('1');

  await rate.evaluate((el) => { el.value = '1.5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await pitch.evaluate((el) => { el.value = '0.8'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.getByTestId('rate-value')).toHaveText('1.5'); // live label updates
  await page.getByTestId('save-profile').click();

  // Reopen — the saved values come back.
  await page.getByTestId('profile-item').filter({ hasText: 'Ana' }).getByTestId('edit-profile').click();
  await expect(page.getByTestId('profile-rate')).toHaveValue('1.5');
  await expect(page.getByTestId('profile-pitch')).toHaveValue('0.8');
});

test('a recognized phrase becomes a user turn and is sent (stubbed)', async ({ page }) => {
  await page.route('**/api/chat', (route) => route.fulfill({ json: { reply: 'spoken reply' } }));
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));

  await openConversation(page, 'Ana', 'B1');
  await page.getByTestId('mic-button').click(); // start listening

  // Simulate a final recognition result, then Stop to finalize the turn deterministically.
  await page.evaluate(() => {
    const r = [{ transcript: 'good morning' }];
    r.isFinal = true;
    window.SpeechRecognition.last.onresult({ resultIndex: 0, results: [r] });
  });
  await page.getByTestId('mic-button').click(); // stop -> finalize -> send

  const transcript = page.getByTestId('transcript');
  await expect(transcript.locator('[data-role="user"]')).toHaveText('good morning');
  await expect(transcript.locator('[data-role="assistant"]')).toHaveText('spoken reply');
});
