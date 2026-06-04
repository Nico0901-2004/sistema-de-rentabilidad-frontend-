const { test } = require('../fixtures/e2eTest');
const { loginAs } = require('../helpers/auth');
const { SesionPage } = require('../page-objects/SesionPage');

test.describe.serial('CP-HU1-1-E2E - Flujo completo login', () => {
  test('permite iniciar sesion con credenciales validas y acceder al dashboard', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    await loginAs(page, 'propietario');
    await sesionPage.expectOwnerDashboardLoaded();
  });
});
