const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { SesionPage } = require('../page-objects/SesionPage');

const INACTIVITY_TIMEOUT_MS = Number(process.env.QA_INACTIVITY_TIMEOUT_MS || 15 * 60 * 1000);

test.describe.serial('CP-HU14-7-E2E - Expiracion por inactividad', () => {
  test.use({ storageState: storageStatePath('propietario') });

  test('cierra sesion automaticamente cuando el usuario permanece inactivo', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    await page.clock.install({ time: new Date() });

    await page.goto('/dashboard');
    await sesionPage.expectOwnerDashboardLoaded();

    await sesionPage.simulateInactivityTimeout(INACTIVITY_TIMEOUT_MS);
    await sesionPage.expectSessionClosedByInactivity();
  });
});
