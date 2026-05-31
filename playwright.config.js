const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.qa'), quiet: true });

const frontendUrl = process.env.QA_FRONTEND_URL || 'http://localhost:3001';
const backendUrl = process.env.QA_BACKEND_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './playwright-E2E',
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  webServer: [
    {
      command: 'npm --prefix ../Sistema-de-Rentabilidad-Backend- run dev:qa',
      url: `${backendUrl}/api/auth/me`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run start:qa',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
