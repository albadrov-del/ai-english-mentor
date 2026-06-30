import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

async function createProfile(page, name, level) {
  await page.getByTestId('new-profile').click();
  await page.getByTestId('profile-name').fill(name);
  await page.getByTestId('profile-level').selectOption(level);
  await page.getByTestId('save-profile').click();
}

const openSettings = (page) => page.getByText('Settings', { exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('Export downloads a JSON backup that contains the profile but no PIN (#34)', async ({ page }) => {
  await createProfile(page, 'Josipa', 'B1');
  await openSettings(page);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-data').click(),
  ]);
  expect(download.suggestedFilename()).toContain('ai-english-mentor-backup');

  const content = await fs.readFile(await download.path(), 'utf8');
  expect(content).toContain('Josipa');
  expect(content.toLowerCase()).not.toContain('pin');
  await expect(page.getByTestId('backup-status')).toContainText('Exported');
});

test('Import restores profiles from a backup file (#34)', async ({ page }) => {
  const backup = {
    app: 'ai-english-mentor',
    version: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    profiles: [{ id: 'p1', name: 'Restored', level: 'B2', interests: 'x', voiceURI: '', rate: 1, pitch: 1 }],
    history: [],
  };

  await openSettings(page);
  // No existing data → import proceeds without a confirm dialog.
  await page.getByTestId('import-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByTestId('profile-item').filter({ hasText: 'Restored' })).toHaveCount(1);
});

test('Importing a non-backup file shows a friendly error (#34)', async ({ page }) => {
  await openSettings(page);
  await page.getByTestId('import-file').setInputFiles({
    name: 'junk.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not json'),
  });
  await expect(page.getByTestId('backup-status')).toContainText('JSON');
  await expect(page.getByTestId('profile-item')).toHaveCount(0);
});
