import { test, expect } from '@playwright/test';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

// Stub SpeechSynthesis so the utterance lifecycle drives the avatar deterministically:
// speak() fires onstart immediately and stores the utterance so the test can fire onend.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const synth = {
      cancel() {},
      speak(u) {
        window.__lastUtterance = u;
        if (u.onstart) u.onstart();
      },
    };
    function FakeUtterance(t) {
      this.text = t;
      this.lang = '';
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
    }
    // window.speechSynthesis is a read-only accessor in real browsers, so a plain
    // assignment is ignored — shadow it with an own property instead.
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true });
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('avatar carries the speaking state only while the reply is spoken', async ({ page }) => {
  await page.route('**/api/chat', (route) => route.fulfill({ json: { reply: 'hello there' } }));
  await page.evaluate(() => localStorage.setItem('aem.pin.v1', 'test-pin'));

  await createProfile(page, 'Ana', 'B1');
  await page.getByTestId('profile-item').filter({ hasText: 'Ana' }).getByTestId('select-profile').click();

  const avatar = page.getByTestId('avatar');
  await expect(avatar).toHaveAttribute('data-speaking', 'false');

  await page.getByTestId('message-input').fill('hi');
  await page.getByTestId('send-message').click();

  // Reply arrives → speak() → stub fires utterance.onstart → speaking.
  await expect(avatar).toHaveAttribute('data-speaking', 'true');
  await expect(avatar).toHaveClass(/speaking/);

  // End the utterance → idle.
  await page.evaluate(() => window.__lastUtterance.onend());
  await expect(avatar).toHaveAttribute('data-speaking', 'false');
});
