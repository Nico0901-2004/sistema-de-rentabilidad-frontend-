const { test } = require('../fixtures/e2eTest');
const { resetLoginGuards } = require('../helpers/loginGuards');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe.serial('CP-HU1-2-E2E - Intento login invalido', () => {
  test('bloquea el acceso con credenciales invalidas para un usuario registrado', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    try {
      await sesionPage.submitInvalidLoginAndExpectRejected('propietario');

      await sesionPage.expectDashboardAccessBlocked();
    } finally {
      await sesionPage.clearLocalLoginLockoutState();
      await resetLoginGuards({ roles: ['propietario'] });
    }
  });
});
