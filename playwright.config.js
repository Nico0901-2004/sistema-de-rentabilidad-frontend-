const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.qa'), quiet: true });

const frontendUrl = process.env.QA_FRONTEND_URL || 'http://localhost:3001';
const backendUrl = process.env.QA_BACKEND_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './playwright-E2E',
  globalSetup: require.resolve('./playwright-E2E/globalSetup'),
  timeout: 45 * 1000,
  expect: {
    timeout: 7 * 1000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm --prefix ../Sistema-de-Rentabilidad-Backend- run dev:qa',
      url: `${backendUrl}/health`,
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
