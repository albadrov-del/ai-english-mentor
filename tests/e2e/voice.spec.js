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

test('mic button toggles listening state (speech stubbed)', async ({ page }) => {
  await openConversation(page, 'Ana', 'B1');

  const micBtn = page.getByTestId('mic-button');
  await expect(micBtn).toBeVisible();
  await expect(micBtn).toHaveAttribute('data-state', 'idle');

  await micBtn.click();
  await expect(micBtn).toHaveAttribute('data-state', 'listening');

  await micBtn.click(); // stop -> stub fires onend -> idle
  await expect(micBtn).toHaveAttribute('data-state', 'idle');
});

test('a recognized phrase becomes a user turn and is sent (stubbed)', async ({ page }) => {
  await page.route('**/api/chat', (route) => route.fulfill({ json: { reply: 'spoken reply' } }));
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));

  await openConversation(page, 'Ana', 'B1');
  await page.getByTestId('mic-button').click();

  // Simulate a final recognition result from the stubbed recognizer.
  await page.evaluate(() =>
    window.SpeechRecognition.last.onresult({ results: [[{ transcript: 'good morning' }]] }),
  );

  const transcript = page.getByTestId('transcript');
  await expect(transcript.locator('[data-role="user"]')).toHaveText('good morning');
  await expect(transcript.locator('[data-role="assistant"]')).toHaveText('spoken reply');
});
