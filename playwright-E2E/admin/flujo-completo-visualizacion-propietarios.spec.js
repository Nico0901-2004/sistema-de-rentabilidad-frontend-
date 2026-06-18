const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { AdminPropietariosPage } = require('../page-objects/AdminPropietariosPage');

test.describe.serial('CP-HU11-1-E2E - Flujo completo visualizacion propietarios', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('muestra correctamente los propietarios para un admin valido', async ({ page }) => {
    const propietariosPage = new AdminPropietariosPage(page);

    await page.goto('/admin-dashboard');
    await propietariosPage.expectAdminHome();

    const ownersResponseBody = await propietariosPage.gotoFromSidebar();
    const owners = propietariosPage.getOwnersFromApi(ownersResponseBody);
    const seedOwner = propietariosPage.getOwnerByEmailFromApi(owners, 'qa_propietario@test.com');

    propietariosPage.expectOwnerFieldsAreValid([seedOwner]);
    await propietariosPage.expectLoaded();
    await propietariosPage.searchOwnerByEmail(seedOwner.email);
    await propietariosPage.expectOwnerRowMatchesApi(seedOwner);
  });
});
