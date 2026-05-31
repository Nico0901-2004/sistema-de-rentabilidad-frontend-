const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe('CP-HU14-4-E2E - Expiracion automatica de sesion', () => {
  test('fuerza logout cuando el JWT expira luego de entrar a una ruta privada', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    try {
      await loginAs(page, 'propietario');
      await sesionPage.expectOwnerDashboardLoaded();

      await sesionPage.expectCurrentSessionExpiresOnProtectedNavigation('/dashboard');
    } finally {
      await sesionPage.clearBrowserSessionState();
    }
  });
});
