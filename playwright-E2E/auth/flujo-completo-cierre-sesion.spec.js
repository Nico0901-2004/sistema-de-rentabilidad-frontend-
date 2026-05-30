const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe('CP-HU14-1-E2E - Flujo completo cierre sesion', () => {
  test('permite cerrar sesion y salir completamente del sistema', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    await loginAs(page, 'empleado');
    await sesionPage.expectEmployeeHome();

    await sesionPage.logout();
    await sesionPage.expectLoginVisible();
    await sesionPage.expectProtectedRouteRedirectsToLogin('/perfil');
    await sesionPage.expectBackendSessionInvalidated();
  });
});
