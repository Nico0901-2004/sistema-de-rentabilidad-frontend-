const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const {
  getOwnerRegistrationData,
  getTemporaryCompanyData,
} = require('../helpers/testDataFactory');
const { cleanupCreatedOwnerAndCompany } = require('../helpers/businessDataGuards');
const { AdminPropietariosPage } = require('../page-objects/AdminPropietariosPage');

test.describe.serial('CP-HU12-1-E2E - Flujo completo registro propietario', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('permite registrar un propietario con datos completos', async ({ page }, testInfo) => {
    const propietariosPage = new AdminPropietariosPage(page);
    const ownerData = getOwnerRegistrationData(testInfo);
    const companyData = getTemporaryCompanyData(testInfo);
    let company;

    try {
      await page.goto('/admin-dashboard');
      await propietariosPage.expectAdminHome();

      company = await propietariosPage.createTemporaryCompanyByApi(companyData);

      await propietariosPage.gotoFromSidebar();
      await propietariosPage.expectLoaded();

      await propietariosPage.openCreateForm();
      await propietariosPage.selectCompanyByName(company.label);

      await propietariosPage.fillOwnerForm(ownerData);
      await propietariosPage.submitCreateFormAndCaptureOwner();

      await propietariosPage.searchOwnerByEmail(ownerData.email);
      await propietariosPage.expectCreatedOwnerVisible(ownerData, company.label);
    } finally {
      await cleanupCreatedOwnerAndCompany({
        ownerEmail: ownerData.email,
        companyId: company?.value,
        companyName: company?.label || companyData.nombre,
      });
    }
  });
});
