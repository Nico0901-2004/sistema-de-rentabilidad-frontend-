const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { AdminPropietariosPage } = require('../page-objects/AdminPropietariosPage');

test.describe('CP-HU11-1-E2E - Flujo completo visualizacion propietarios', () => {
  test('muestra correctamente los propietarios para un admin valido', async ({ page }) => {
    const propietariosPage = new AdminPropietariosPage(page);

    await loginAs(page, 'admin');
    await propietariosPage.expectAdminHome();

    const ownersResponseBody = await propietariosPage.gotoFromSidebar();
    const owners = propietariosPage.getOwnersFromApi(ownersResponseBody);

    propietariosPage.expectOwnerFieldsAreValid(owners);
    await propietariosPage.expectLoaded();
    await propietariosPage.expectOwnersFromApiVisible(owners);
    await propietariosPage.searchFirstOwnerFromApi(owners);
  });
});
