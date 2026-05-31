const { expect } = require('@playwright/test');
const { getQaEnv } = require('../helpers/env');

const HOME_BY_ROLE = {
  admin: '/admin-dashboard',
  propietario: '/dashboard',
  lider: '/panel-lider',
  empleado: '/mi-espacio',
};

class SesionPage {
  constructor(page) {
    this.page = page;
    this.logoutButton = page.getByRole('button', { name: /Cerrar sesi.n/i });
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.systemBrand = page.getByText('Sistema de Rentabilidad').first();
    this.ownerDashboardSummary = page.getByText('Resumen de tu empresa');
    this.ownerDashboardLink = page.locator('nav a[href="/dashboard"]');
    this.ownerDashboardMain = page.locator('main');
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

  async expectBackendSessionInvalidated() {
    const { backendUrl } = getQaEnv();
    const response = await this.page.request.get(`${backendUrl}/api/auth/me`);

    expect(response.status()).toBe(401);
  }
}

module.exports = {
  SesionPage,
};
