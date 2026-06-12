const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env.qa'), quiet: true });

const baseUrl = (process.env.LHCI_BASE_URL || process.env.QA_FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
const projectId = process.env.LHCI_PROJECT_ID || '1';
const shouldStartServer = process.env.LHCI_START_SERVER === 'true';
const defaultChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromePath = process.env.CHROME_PATH || (fs.existsSync(defaultChromePath) ? defaultChromePath : undefined);
const puppeteerLaunchOptions = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

if (chromePath) {
  puppeteerLaunchOptions.executablePath = chromePath;
}

const collect = {
  url: [
    `${baseUrl}/login`,
    `${baseUrl}/dashboard`,
    `${baseUrl}/proyectos`,
    `${baseUrl}/usuarios`,
    `${baseUrl}/servicios`,
    `${baseUrl}/proyectos/${encodeURIComponent(projectId)}/fases`,
  ],
  numberOfRuns: Number.parseInt(process.env.LHCI_NUMBER_OF_RUNS || '1', 10),
  puppeteerScript: 'tests/non-functional/accessibility/lhci-auth.js',
  chromePath,
  puppeteerLaunchOptions,
  settings: {
    onlyCategories: ['accessibility'],
    disableStorageReset: true,
  },
};

if (shouldStartServer) {
  collect.startServerCommand = 'npm run start:qa';
  collect.startServerReadyPattern = 'Compiled successfully|webpack compiled successfully';
  collect.startServerReadyTimeout = 120000;
}

module.exports = {
  ci: {
    collect,
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: path.resolve(__dirname, 'reports'),
    },
  },
};
