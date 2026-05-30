const { expect } = require('@playwright/test');
const { getQaEnv } = require('../helpers/env');

class SesionPage {
  constructor(page) {
    this.page = page;
    this.logoutButton = page.getByRole('button', { name: /Cerrar sesi.n/i });
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
  }

  async expectEmployeeHome() {
    await expect(this.page).toHaveURL(/\/mi-espacio\/?$/);
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
