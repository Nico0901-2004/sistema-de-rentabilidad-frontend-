const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe('CP-HU1-1-E2E - Flujo completo login', () => {
  test('permite iniciar sesion con credenciales validas y acceder al dashboard', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    await loginAs(page, 'propietario');
    await sesionPage.expectOwnerDashboardLoaded();
  });
});
