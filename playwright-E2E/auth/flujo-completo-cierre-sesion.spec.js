const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe.serial('CP-HU14-1-E2E - Flujo completo cierre sesion', () => {
  test.use({ storageState: storageStatePath('empleado') });

  test('permite cerrar sesion y salir completamente del sistema', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    await page.goto('/mi-espacio');
    await sesionPage.expectEmployeeHome();

    await sesionPage.logout();
    await sesionPage.expectLoginVisible();
    await sesionPage.expectProtectedRouteRedirectsToLogin('/perfil');
    await sesionPage.expectBackendSessionInvalidated();
  });
});
