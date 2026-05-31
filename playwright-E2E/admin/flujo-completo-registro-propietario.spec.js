const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const {
  getOwnerRegistrationData,
  getTemporaryCompanyData,
} = require('../helpers/testDataFactory');
const { AdminPropietariosPage } = require('../page-objects/AdminPropietariosPage');

test.describe('CP-HU12-1-E2E - Flujo completo registro propietario', () => {
  test('permite registrar un propietario con datos completos', async ({ page }) => {
    const propietariosPage = new AdminPropietariosPage(page);
    const ownerData = getOwnerRegistrationData();
    const companyData = getTemporaryCompanyData();

    await loginAs(page, 'admin');
    await propietariosPage.expectAdminHome();

    await propietariosPage.gotoFromSidebar();
    await propietariosPage.expectLoaded();

    await propietariosPage.openCreateForm();
    const company = await propietariosPage.selectFirstAvailableCompanyOrCreateOne(companyData);

    await propietariosPage.fillOwnerForm(ownerData);
    await propietariosPage.submitCreateFormAndCaptureOwner();

    await propietariosPage.searchOwnerByEmail(ownerData.email);
    await propietariosPage.expectCreatedOwnerVisible(ownerData, company.label);
  });
});
