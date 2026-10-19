import { test, expect } from '@playwright/test';
test('public navigation, filtering and accessible collection dialog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Where flowers');
  await page.getByRole('button', { name: 'Rose Bouquets', exact: true }).click();
  await expect(page.locator('.flower-card')).toHaveCount(1);
  await page.locator('.flower-card').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('bouquet form has unchecked optional consent and truthful unavailable response', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Something uniquely yours? Build a bouquet inquiry' })
    .click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Your name').fill('Test inquiry');
  await form.getByLabel('Phone number').fill('+919999999999');
  for (const name of ['Occasion', 'Flowers', 'Colour palette', 'Bouquet size', 'Wrapping'])
    await form.getByLabel(name, { exact: true }).selectOption({ index: 1 });
  await form.getByLabel('Tell us a little more').fill('Disposable local test inquiry');
  await expect(form.getByRole('checkbox')).not.toBeChecked();
  await form.getByRole('button', { name: 'Send your inquiry' }).click();
  await expect(form.getByRole('status')).toContainText('not configured');
});
test('private access is denied without credentials', async ({ page, request }) => {
  await page.goto('/admin/clients');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: 'Enter your studio' })).toBeDisabled();
  const response = await request.get('/api/admin/clients');
  expect(response.status()).toBe(503);
});
test('mobile menu and reduced motion remain usable', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('capture reference viewport', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.hero-image img').waitFor({ state: 'visible' });
  await page.screenshot({ path: `docs/${info.project.name}-preview.png`, fullPage: false });
});

test('server-rendered page remains readable without JavaScript and form data stays out of URLs', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.inquiry-form')).toHaveAttribute('method', 'post');
  await context.close();
});
