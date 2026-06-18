const { expect } = require('@playwright/test');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const { getQaEnv } = require('../helpers/env');

const HOME_BY_ROLE = {
  admin: '/admin-dashboard',
  propietario: '/dashboard',
  lider: '/panel-lider',
  empleado: '/mi-espacio',
};

const LOGIN_LOCKOUT_KEY = 'login_attempts_lockout';
const LAST_ACTIVITY_KEY = 'last_activity';
const ACCESS_TOKEN_COOKIE = 'access_token';
const BACKEND_ENV_PATH = path.resolve(__dirname, '..', '..', '..', 'Sistema-de-Rentabilidad-Backend-', '.env.qa');

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');

const decodeJwtPayload = (token) => {
  const [, encodedPayload] = token.split('.');

  if (!encodedPayload) {
    throw new Error('JWT invalido: no contiene payload');
  }

  return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
};

const signExpiredJwt = (payload) => {
  dotenv.config({ path: BACKEND_ENV_PATH, quiet: true });

  if (!process.env.JWT_SECRET) {
    throw new Error('Falta JWT_SECRET para firmar el JWT expirado de QA');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const { iat, exp, nbf, iss, aud, ...basePayload } = payload;
  const claims = {
    ...basePayload,
    sub: String(payload.sub || payload.id_usuario),
    iat: now - 3600,
    exp: now - 60,
  };

  if (process.env.JWT_REQUIRE_CLAIMS === 'true') {
    claims.iss = process.env.JWT_ISSUER || 'sistema-de-rentabilidad-backend';
    claims.aud = process.env.JWT_AUDIENCE || 'sistema-de-rentabilidad-client';
  }

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
};

class SesionPage {
  constructor(page) {
    this.page = page;
    this.logoutButton = page.getByRole('button', { name: /Cerrar sesi.n/i });
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.systemBrand = page.getByText('Sistema de Rentabilidad').first();
    this.topbarLogoutButton = page.getByRole('button', { name: /^Salir$/i });
    this.ownerDashboardSummary = page.getByText('Resumen de tu empresa');
    this.ownerDashboardLink = page.locator('nav a[href="/dashboard"]');
    this.ownerDashboardMain = page.locator('main');
    this.invalidCredentialsAlert = page.getByText(/Credenciales incorrectas/i);
  }

  getCredentialsForRole(role) {
    const qaEnv = getQaEnv();
    const email = qaEnv.users[role];
    const homePath = HOME_BY_ROLE[role];

    if (!email || !homePath) {
      throw new Error(`Rol QA no soportado: ${role}`);
    }

    return {
      email,
      password: qaEnv.password,
      homePath,
    };
  }

  async gotoLogin() {
    await this.page.goto('/login');
    await this.expectLoginVisible();
  }

  async clearLocalLoginLockoutState() {
    await this.page.evaluate((key) => {
      localStorage.removeItem(key);
    }, LOGIN_LOCKOUT_KEY);
  }

  async clearBrowserSessionState() {
    await this.page.context().clearCookies();
    await this.page.goto('/login');
    await this.page.evaluate((key) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem(key);
    }, LOGIN_LOCKOUT_KEY);
    await this.expectLoginVisible();
  }

  async setExpiredAccessTokenCookieFromCurrentSession() {
    const { backendUrl } = getQaEnv();
    const [currentAccessTokenCookie] = (await this.page.context().cookies(backendUrl))
      .filter((cookie) => cookie.name === ACCESS_TOKEN_COOKIE);

    expect(currentAccessTokenCookie).toBeDefined();

    const expiredToken = signExpiredJwt(decodeJwtPayload(currentAccessTokenCookie.value));
    const cookieUrl = currentAccessTokenCookie.domain && currentAccessTokenCookie.path
      ? undefined
      : backendUrl;

    await this.page.context().addCookies([
      {
        ...currentAccessTokenCookie,
        name: ACCESS_TOKEN_COOKIE,
        value: expiredToken,
        ...(cookieUrl ? { url: cookieUrl } : {}),
        httpOnly: true,
        secure: backendUrl.startsWith('https://'),
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 3600,
      },
    ]);
  }

  async expectCurrentSessionExpiresOnProtectedNavigation(path = '/dashboard') {
    await this.setExpiredAccessTokenCookieFromCurrentSession();

    const expiredSessionResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/auth/me') && response.request().method() === 'GET'
    );

    await this.page.goto(path);

    expect((await expiredSessionResponse).status()).toBe(401);
    await this.expectLoginVisible();
    await this.expectNoPrivateContentVisible();
    await this.expectBackendSessionInvalidated();
  }

  async simulateInactivityTimeout(timeoutMs = 15 * 60 * 1000) {
    await this.page.evaluate(({ key, timeout }) => {
      localStorage.setItem(key, String(Date.now() - timeout - 1000));
    }, { key: LAST_ACTIVITY_KEY, timeout: timeoutMs });
    await this.page.clock.runFor(31 * 1000);
  }

  async expectSessionClosedByInactivity() {
    await this.expectLoginVisible();
    await this.expectNoPrivateContentVisible();
    await this.expectBackendSessionInvalidated();
  }

  async fillLoginCredentials(email, password) {
    await this.emailInput.fill(email);
    await expect(this.emailInput).toHaveValue(email);

    await this.passwordInput.fill(password);
    await expect(this.passwordInput).toHaveValue(password);
  }

  async submitLoginAndExpectHome(homePath) {
    const loginResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );

    await this.loginButton.click();
    expect((await loginResponse).ok()).toBeTruthy();
    await expect(this.page).toHaveURL(new RegExp(`${homePath}/?$`));
  }

  getInvalidPassword(password) {
    return `${password}__invalid_cp_hu1_2`;
  }

  async submitInvalidLoginAndExpectRejected(role = 'propietario') {
    const { email, password } = this.getCredentialsForRole(role);
    const invalidPassword = this.getInvalidPassword(password);

    await this.gotoLogin();
    await this.clearLocalLoginLockoutState();
    await this.fillLoginCredentials(email, invalidPassword);

    const loginResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );

    await this.loginButton.click();
    expect((await loginResponse).status()).toBe(401);
    await expect(this.invalidCredentialsAlert).toBeVisible();
    await expect(this.page).toHaveURL(/\/login\/?$/);
    await expect(this.ownerDashboardSummary).not.toBeVisible();
  }

  async loginAs(role = 'propietario') {
    const { email, password, homePath } = this.getCredentialsForRole(role);

    await this.gotoLogin();
    await this.fillLoginCredentials(email, password);
    await this.submitLoginAndExpectHome(homePath);
  }

  async expectEmployeeHome() {
    await expect(this.page).toHaveURL(/\/mi-espacio\/?$/);
  }

  async expectOwnerDashboardLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/?$/);
    await expect(this.ownerDashboardSummary).toBeVisible();
    await expect(this.ownerDashboardLink).toBeVisible();
    await expect(this.systemBrand).toBeVisible();
    await this.expectOwnerDashboardMetricsLoaded();
    await expect(this.ownerDashboardMain.locator('.skeleton')).toHaveCount(0);
  }

  async expectOwnerDashboardMetricsLoaded() {
    const metricLabels = ['Servicios', 'Líderes', 'Empleados', 'Proyectos'];

    for (const label of metricLabels) {
      const metricCard = this.ownerDashboardMain.locator('.stat-card').filter({ hasText: label });
      const metricValue = metricCard.locator('h3');

      await expect(metricCard).toBeVisible();
      await expect(metricValue).not.toHaveText('…');
      await expect(metricValue).toContainText(/\d+/);
    }
  }

  async logout() {
    const logoutResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/auth/logout') && response.request().method() === 'POST'
    );

    await this.logoutButton.click();
    expect((await logoutResponse).ok()).toBeTruthy();
  }

  async expectLoginVisible() {
    await expect(this.page).toHaveURL(/\/login\/?$/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectProtectedRouteRedirectsToLogin(path) {
    await this.page.goto(path);
    await this.expectLoginVisible();
  }

  async expectNoPrivateContentVisible() {
    await expect(this.page.locator('main')).toHaveCount(0);
    await expect(this.page.locator('nav')).toHaveCount(0);
    await expect(this.logoutButton).not.toBeVisible();
    await expect(this.topbarLogoutButton).not.toBeVisible();
    await expect(this.ownerDashboardSummary).not.toBeVisible();
  }

  async expectPrivateRouteBlockedForAnonymousUser(path) {
    await this.clearBrowserSessionState();
    await this.expectBackendSessionInvalidated();
    await this.expectProtectedRouteRedirectsToLogin(path);
    await this.expectNoPrivateContentVisible();
    await this.expectBackendSessionInvalidated();
  }

  async expectDashboardAccessBlocked() {
    await this.expectProtectedRouteRedirectsToLogin('/dashboard');
    await this.expectBackendSessionInvalidated();
  }

  async clearBackendFailedLoginState(_requestContext, role = 'propietario') {
    const { resetLoginGuards } = require('../helpers/loginGuards');

    await resetLoginGuards({ roles: [role] });
  }

  async expectBackendSessionInvalidated() {
    const { backendUrl } = getQaEnv();
    const response = await this.page.request.get(`${backendUrl}/api/auth/me`);

    expect(response.status()).toBe(401);
  }
}

module.exports = {
  SesionPage,
};
