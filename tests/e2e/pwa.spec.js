import { test, expect } from '@playwright/test';

test('manifest is linked, fetchable, and valid', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  // page.request bypasses the service worker — validates the server actually serves it.
  const resp = await page.request.get(new URL(href, page.url()).href);
  expect(resp.ok()).toBeTruthy();

  const manifest = await resp.json();
  expect(manifest.name).toBe('AI English Mentor');
  expect(manifest.display).toBe('standalone');
  const sizes = (manifest.icons ?? []).map((i) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
});

test('service worker registers and becomes active', async ({ page }) => {
  await page.goto('/');
  const active = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return !!(reg && reg.active);
  });
  expect(active).toBe(true);
});

test('app shell loads offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready); // SW active + shell precached
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.locator('.app-title')).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.app-title')).toBeVisible(); // served from the SW cache
  await context.setOffline(false);
});
