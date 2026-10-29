const root = process.cwd();
const output = process.env.AUDIT_OUTPUT_DIR || root + '/docs/audit-latest';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
import { chromium } from '@playwright/test';
import fs from 'node:fs';
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const b = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      (process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : undefined),
    headless: true,
  });
  const rows = [];
  try {
    for (const width of [320, 375, 390, 430, 459, 460, 768, 1024, 1280, 1440, 1920]) {
      const p = await b.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      const response = await p.goto(base + '/?intro=0');
      await p.waitForTimeout(500);
      await p.addScriptTag({ path: root + '/node_modules/axe-core/axe.min.js' });
      const layout = await p.evaluate(async () => ({
        status: document.readyState,
        h1: document.querySelectorAll('h1').length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        sections: [...document.querySelectorAll('main section')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left < -0.5 || r.right > innerWidth + 0.5;
          })
          .map((el) => el.id),
        duplicateIds: [...document.querySelectorAll('[id]')]
          .map((el) => el.id)
          .filter((id, i, all) => all.indexOf(id) !== i),
        violations: (
          await axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
            },
          })
        ).violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          targets: v.nodes.map((n) => n.target),
        })),
      }));
      if ([390, 1440].includes(width))
        await p.screenshot({ path: output + '/after-' + width + '.png', fullPage: true });
      await p.getByRole('button', { name: 'Enquire about daily flowers' }).click();
      const dialog = p.getByRole('dialog');
      await dialog.waitFor();
      const form = await dialog.evaluate((el) => ({
        overflow: el.scrollWidth > el.clientWidth + 1,
        left: el.getBoundingClientRect().left,
        right: el.getBoundingClientRect().right,
      }));
      const modalAxe = await p.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
          })
        ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      );
      await p.keyboard.press('Escape');
      const result = { width, http: response.status(), ...layout, dialog: form, modalAxe, errors };
      rows.push(result);
      console.log(JSON.stringify(result));
      if (
        layout.overflow ||
        layout.sections.length ||
        layout.duplicateIds.length ||
        layout.h1 !== 1 ||
        layout.violations.length ||
        form.overflow ||
        modalAxe.length ||
        errors.length
      )
        process.exitCode = 1;
      await p.close();
    }
    fs.writeFileSync(output + '/responsive-and-axe.json', JSON.stringify(rows, null, 2));
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
