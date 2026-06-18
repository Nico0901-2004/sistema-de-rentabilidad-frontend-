const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env.qa'), quiet: true });

let authenticated = false;

const stripTrailingSlash = (value) => value.replace(/\/+$/, '');

const getBaseUrl = () => stripTrailingSlash(process.env.LHCI_BASE_URL || process.env.QA_FRONTEND_URL || 'http://localhost:3001');
const getBackendUrl = () => stripTrailingSlash(process.env.LHCI_BACKEND_URL || process.env.QA_BACKEND_URL || 'http://localhost:3000');

const getCredentials = () => {
  const email = process.env.LHCI_AUTH_EMAIL || process.env.QA_PROPIETARIO_EMAIL;
  const password = process.env.LHCI_AUTH_PASSWORD || process.env.QA_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('Configura LHCI_AUTH_EMAIL/LHCI_AUTH_PASSWORD o QA_PROPIETARIO_EMAIL/QA_USER_PASSWORD para auditar rutas protegidas.');
  }

  return { email, password };
};

const deleteCookiesFor = async (page, urls) => {
  const cookies = [];

  for (const url of urls) {
    cookies.push(...await page.cookies(url));
  }

  if (cookies.length > 0) {
    await page.deleteCookie(...cookies);
  }
};

const clearLoginState = async (page) => {
  await page.evaluate(() => {
    localStorage.removeItem('login_attempts_lockout');
    localStorage.removeItem('auth_event');
    sessionStorage.clear();
  });
};

const loginThroughApi = async (page, { backendUrl, email, password }) => {
  const result = await page.evaluate(
    async ({ apiUrl, userEmail, userPassword }) => {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
        }),
      });

      return {
        ok: response.ok,
        status: response.status,
        body: await response.text(),
      };
    },
    {
      apiUrl: backendUrl,
      userEmail: email,
      userPassword: password,
    }
  );

  if (!result.ok) {
    throw new Error(`No se pudo autenticar propietario para NF-18. Status ${result.status}: ${result.body}`);
  }
};

module.exports = async (browser, context) => {
  const page = await browser.newPage();
  const baseUrl = getBaseUrl();
  const backendUrl = getBackendUrl();
  const targetPath = new URL(context.url).pathname;

  try {
    await page.setViewport({ width: 1366, height: 768 });
    page.setDefaultNavigationTimeout(60000);

    if (targetPath === '/login') {
      await deleteCookiesFor(page, [baseUrl, backendUrl]);
      await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
      await clearLoginState(page);
      authenticated = false;
      return;
    }

    if (authenticated) {
      return;
    }

    const { email, password } = getCredentials();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await deleteCookiesFor(page, [baseUrl, backendUrl]);
    await clearLoginState(page);
    await loginThroughApi(page, { backendUrl, email, password });
    authenticated = true;
  } finally {
    await page.close();
  }
};
