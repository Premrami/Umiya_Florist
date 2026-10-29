import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
        (process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : undefined),
    },
    screenshot: 'only-on-failure',
  },
  projects: [
    ...(process.env.PLAYWRIGHT_CROSS_BROWSER === '1'
      ? [
          {
            name: 'firefox-desktop',
            use: {
              browserName: 'firefox' as const,
              launchOptions: {},
              viewport: { width: 1440, height: 1000 },
            },
          },
          {
            name: 'firefox-mobile',
            use: {
              browserName: 'firefox' as const,
              launchOptions: {},
              viewport: { width: 390, height: 844 },
            },
          },
          {
            name: 'webkit-desktop',
            use: {
              browserName: 'webkit' as const,
              launchOptions: {},
              viewport: { width: 1440, height: 1000 },
            },
          },
          {
            name: 'webkit-mobile',
            use: {
              browserName: 'webkit' as const,
              launchOptions: {},
              viewport: { width: 390, height: 844 },
              isMobile: true,
              hasTouch: true,
            },
          },
        ]
      : []),

    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
});
