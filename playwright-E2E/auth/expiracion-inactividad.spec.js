const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { SesionPage } = require('../page-objects/SesionPage');

const INACTIVITY_TIMEOUT_MS = Number(process.env.QA_INACTIVITY_TIMEOUT_MS || 5000);

test.describe('CP-HU14-7-E2E - Expiracion por inactividad', () => {
  test('cierra sesion automaticamente cuando el usuario permanece inactivo', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    await page.clock.install({ time: new Date() });

    await loginAs(page, 'propietario');
    await sesionPage.expectOwnerDashboardLoaded();

    await sesionPage.simulateInactivityTimeout(INACTIVITY_TIMEOUT_MS);
    await sesionPage.expectSessionClosedByInactivity();
  });
});
