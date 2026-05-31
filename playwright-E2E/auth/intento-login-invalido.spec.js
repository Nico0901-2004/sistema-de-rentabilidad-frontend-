const { test } = require('@playwright/test');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe('CP-HU1-2-E2E - Intento login invalido', () => {
  test('bloquea el acceso con credenciales invalidas para un usuario registrado', async ({ page, request }) => {
    const sesionPage = new SesionPage(page);
    let shouldCleanBackendFailedLoginState = false;

    try {
      await sesionPage.submitInvalidLoginAndExpectRejected('propietario');
      shouldCleanBackendFailedLoginState = true;

      await sesionPage.expectDashboardAccessBlocked();
    } finally {
      await sesionPage.clearLocalLoginLockoutState();

      if (shouldCleanBackendFailedLoginState) {
        await sesionPage.clearBackendFailedLoginState(request, 'propietario');
      }
    }
  });
});