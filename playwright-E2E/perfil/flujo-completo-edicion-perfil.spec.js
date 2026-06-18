const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getProfileEditName } = require('../helpers/testDataFactory');
const { resetQaUserProfile } = require('../helpers/businessDataGuards');
const { PerfilPage } = require('../page-objects/PerfilPage');

test.describe.serial('CP-HU2-1-E2E - Flujo completo edicion perfil', () => {
  test.use({ storageState: storageStatePath('empleado') });

  test('permite editar el perfil con datos validos y ver los cambios en el sistema', async ({ page }) => {
    const perfilPage = new PerfilPage(page);
    let originalName;
    let updatedName;

    try {
      await resetQaUserProfile('empleado');

      await perfilPage.goto();
      await perfilPage.startEditing();

      originalName = await perfilPage.getCurrentNameFromForm();
      updatedName = getProfileEditName(originalName);

      await perfilPage.updateName(updatedName);

      await perfilPage.expectProfileUpdated(updatedName);
      await perfilPage.reloadAndExpectName(updatedName);
    } finally {
      await resetQaUserProfile('empleado');
    }
  });
});
