const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getServiceRegistrationData } = require('../helpers/testDataFactory');
const { deactivateCreatedService } = require('../helpers/businessDataGuards');
const { ServiciosPage } = require('../page-objects/ServiciosPage');

test.describe.serial('CP-HU8-1-E2E - Flujo completo registro servicio', () => {
  test.use({ storageState: storageStatePath('propietario') });

  test('permite registrar un servicio y verlo en el listado', async ({ page }, testInfo) => {
    const serviciosPage = new ServiciosPage(page);
    const serviceData = getServiceRegistrationData(testInfo);
    let createdService;

    try {
      await page.goto('/dashboard');
      await serviciosPage.gotoFromSidebar();
      await serviciosPage.expectLoaded();

      createdService = await serviciosPage.createService(serviceData);
      await serviciosPage.expectServiceVisible(createdService);
    } finally {
      await deactivateCreatedService(createdService?.id_servicio);
    }
  });
});
