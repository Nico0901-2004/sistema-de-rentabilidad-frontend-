const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getCompanyRegistrationData } = require('../helpers/testDataFactory');
const { cleanupCreatedCompany } = require('../helpers/businessDataGuards');
const { AdminEmpresasPage } = require('../page-objects/AdminEmpresasPage');

test.describe.serial('CP-HU4-1-E2E - Flujo completo registro empresa', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('permite registrar una empresa y verla en el listado', async ({ page }, testInfo) => {
    const empresasPage = new AdminEmpresasPage(page);
    const companyData = getCompanyRegistrationData(testInfo);
    let createdCompany;

    try {
      await page.goto('/admin-dashboard');
      await empresasPage.gotoFromSidebar();
      await empresasPage.expectLoaded();

      createdCompany = await empresasPage.createCompany(companyData);
      await empresasPage.expectCompanyVisible(createdCompany);
    } finally {
      await cleanupCreatedCompany({
        companyId: createdCompany?.id_empresa,
        companyName: companyData.nombre,
      });
    }
  });
});
