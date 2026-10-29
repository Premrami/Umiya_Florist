import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});
test('public sections, anchor targets and readable server content', async ({ page }) => {
  await page.goto('/?intro=0');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  for (const id of [
    'home',
    'about',
    'flowers',
    'pooja',
    'decorations',
    'work',
    'testimonials',
    'contact',
  ])
    await expect(page.locator('#' + id)).toHaveCount(1);
  const missing = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .filter((link) => !document.getElementById((link as HTMLAnchorElement).hash.slice(1)))
        .map((link) => link.getAttribute('href')),
    );
  expect(missing).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('inquiry errors, retry, duplicate prevention and success without live submissions', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/api/public/inquiries', async (route) => {
    requests++;
    await new Promise((resolve) => setTimeout(resolve, 180));
    await route.fulfill({
      status: requests === 1 ? 400 : 201,
      json:
        requests === 1
          ? { error: 'Please check your phone number.', field: 'phone' }
          : { received: true },
    });
  });
  await page.goto('/?intro=0');
  await page
    .getByRole('button', { name: 'Something uniquely yours? Build a bouquet inquiry' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name').fill('Audit test');
  await dialog.getByLabel('Phone number').fill('+91abc9876543210');
  await expect(dialog.getByLabel('Phone number')).toHaveValue('+919876543210');
  for (const label of ['Occasion', 'Flowers', 'Colour palette', 'Bouquet size', 'Wrapping'])
    await dialog.getByLabel(label, { exact: true }).selectOption({ index: 1 });
  await dialog
    .getByLabel('Tell us a little more')
    .fill('Test data only — do not send to a provider.');
  await expect(dialog.getByRole('checkbox')).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Send your inquiry' }).click();
  await expect(dialog.getByRole('status')).toContainText('Please check your phone number.');
  await expect(dialog.getByLabel('Phone number')).toHaveAttribute('aria-invalid', 'true');
  await dialog.getByLabel('Phone number').fill('+919876543211');
  await expect(dialog.getByLabel('Phone number')).not.toHaveAttribute('aria-invalid', 'true');
  await dialog.locator('form').evaluate((form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(dialog.getByRole('status')).toContainText('received');
  expect(requests).toBe(2);
  await expect(dialog.getByLabel('Your name')).toHaveValue('');
});
test('private access stays protected', async ({ page, request }) => {
  await page.goto('/admin/clients');
  await expect(page).toHaveURL(/\/login/);
  const response = await request.get('/api/admin/clients');
  expect([401, 503]).toContain(response.status());
  expect(response.headers()['x-robots-tag']).toContain('noindex');
});
test('mobile More and desktop menu retain keyboard close and focus return', async ({
  page,
}, info) => {
  await page.goto('/?intro=0');
  if (info.project.name.endsWith('mobile')) {
    const dock = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
    expect(await dock.locator('.dock-item').allTextContents()).toEqual([
      'Home',
      'About',
      'Flowers',
      'Pooja Flowers',
      'More',
    ]);
    const more = dock.getByRole('button', { name: 'More' });
    await more.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(more).toBeFocused();
    await more.click();
    await page.getByRole('dialog').getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(/#contact$/);
  } else {
    const link = page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'About', exact: true });
    await link.click();
    await expect(page).toHaveURL(/#about$/);
  }
});
test('normal animated introduction remains skippable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?intro=1');
  await expect(page.locator('.home-entrance-content')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.home-entrance-content')).not.toHaveAttribute('inert', '');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
test('server-rendered content is readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#contact .inquiry-form')).toHaveAttribute('method', 'post');
  await context.close();
});
test('branded 404 and privacy metadata', async ({ page }) => {
  const r = await page.goto('/this-page-does-not-exist');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('out of place');
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy | Umiya Florist');
});

test('full flower-to-logo sequence survives lazy loading', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const state = { seed: false, flower: false, bud: false, opened: false };
    (window as any).__introChecks = state;
    let started = false;
    const timer = setInterval(() => {
      const intro = document.querySelector('.brand-intro');
      if (intro) started = true;
      const seed = document.querySelector<SVGElement>('.intro-seed');
      const flower = document.querySelector('.intro-flower-heart');
      const bud = document.querySelector('.intro-y-bud');
      if (seed?.style.transform) state.seed = true;
      if (flower && Number(getComputedStyle(flower).opacity) > 0.9) state.flower = true;
      if (bud?.getAttribute('transform') === 'scale(1)') state.bud = true;
      if (started && !intro) {
        state.opened = true;
        clearInterval(timer);
      }
    }, 40);
  });
  await page.goto('/?intro=1');
  await page.waitForFunction(() => (window as any).__introChecks.opened, { timeout: 20000 });
  expect(await page.evaluate(() => (window as any).__introChecks)).toEqual({
    seed: true,
    flower: true,
    bud: true,
    opened: true,
  });
});
