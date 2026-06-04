const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe.serial('CP-HU14-4-E2E - Expiracion automatica de sesion', () => {
  test.use({ storageState: storageStatePath('propietario') });

  test('fuerza logout cuando el JWT expira luego de entrar a una ruta privada', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    try {
      await page.goto('/dashboard');
      await sesionPage.expectOwnerDashboardLoaded();

      await sesionPage.expectCurrentSessionExpiresOnProtectedNavigation('/dashboard');
    } finally {
      await sesionPage.clearBrowserSessionState();
    }
  });
});
