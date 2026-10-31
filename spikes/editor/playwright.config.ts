import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', workers: 1, timeout: 45000, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3100', headless: true, screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} },
  webServer: { command: 'npm run build && npm start', url: 'http://127.0.0.1:3100/health', reuseExistingServer: false, timeout: 60000 },
});
