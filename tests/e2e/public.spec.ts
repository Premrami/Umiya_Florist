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
  const dialog = page.getByRole('dialog', { name: 'Flower inquiry', exact: true });
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
  await expect(page.getByRole('dialog', { name: 'Inquiry sent', exact: true })).toHaveCount(0);
  await expect(dialog.getByLabel('Phone number')).toHaveAttribute('aria-invalid', 'true');
  await dialog.getByLabel('Phone number').fill('+919876543211');
  await expect(dialog.getByLabel('Phone number')).not.toHaveAttribute('aria-invalid', 'true');
  await dialog.locator('form').evaluate((form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  const confirmation = page.getByRole('dialog', { name: 'Inquiry sent', exact: true });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByRole('status')).toContainText('received');
  await expect(confirmation.getByRole('button', { name: 'Done', exact: true })).toBeFocused();
  await confirmation.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(dialog).toBeVisible();
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

test('contact inquiry shows a responsive confirmation and Escape returns focus', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/api/public/inquiries', async (route) => {
    requests++;
    await route.fulfill({ status: 201, json: { received: true } });
  });
  await page.goto('/?intro=0');
  const form = page.locator('#contact .inquiry-form');
  await form.getByLabel('Your name', { exact: true }).fill('Confirmation test');
  await form.getByLabel('Phone number', { exact: true }).fill('+919876543210');
  await form
    .getByLabel('What can we create for you?', { exact: true })
    .fill('Test only; do not send a real message.');
  const submit = form.getByRole('button', { name: 'Send your inquiry', exact: true });
  await submit.click();
  const confirmation = page.getByRole('dialog', { name: 'Inquiry sent', exact: true });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByRole('status')).toContainText('received');
  expect(
    await confirmation.evaluate((el) => {
      const bounds = el.getBoundingClientRect();
      return (
        bounds.left >= 0 &&
        bounds.right <= innerWidth &&
        bounds.top >= 0 &&
        bounds.bottom <= innerHeight &&
        el.scrollWidth <= el.clientWidth
      );
    }),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(confirmation).toHaveCount(0);
  await expect(submit).toBeFocused();
  await expect(form.getByLabel('Your name', { exact: true })).toHaveValue('');
  expect(requests).toBe(1);
});

test('occasion gallery opens beside inquiry action, browses its photos and restores focus', async ({
  page,
}) => {
  await page.goto('/?intro=0');
  const opener = page.getByRole('button', { name: 'View wedding gallery', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Weddings gallery', exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const first = dialog.getByRole('button', { name: 'Open weddings photo 1', exact: true });
  if (await first.count()) {
    await first.click();
    await expect(dialog.getByRole('status')).toContainText('Photo 1 of');
    await dialog.getByRole('button', { name: 'Back to gallery', exact: true }).click();
    await expect(first).toBeFocused();
  } else await expect(dialog).toContainText('Photos for this occasion are being gathered');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.getByRole('button', { name: 'Balloon Decorations', exact: true }).click();
  await page.getByRole('button', { name: 'View balloon decoration gallery', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Balloon Decorations gallery', exact: true }),
  ).toBeVisible();
});
