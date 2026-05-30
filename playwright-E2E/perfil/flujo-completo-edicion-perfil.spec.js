const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { getProfileEditName } = require('../helpers/testDataFactory');
const { PerfilPage } = require('../page-objects/PerfilPage');

test.describe('CP-HU2-1-E2E - Flujo completo edicion perfil', () => {
  test('permite editar el perfil con datos validos y ver los cambios en el sistema', async ({ page }) => {
    const perfilPage = new PerfilPage(page);
    let originalName;
    let updatedName;
    let shouldRestoreName = false;

    await loginAs(page, 'empleado');
    await perfilPage.goto();
    await perfilPage.startEditing();

    originalName = await perfilPage.getCurrentNameFromForm();
    updatedName = getProfileEditName(originalName);

    try {
      await perfilPage.updateName(updatedName);
      shouldRestoreName = true;

      await perfilPage.expectProfileUpdated(updatedName);
      await perfilPage.reloadAndExpectName(updatedName);
    } finally {
      if (shouldRestoreName && originalName && updatedName !== originalName) {
        await perfilPage.startEditing();
        await perfilPage.updateName(originalName);
        await perfilPage.expectProfileUpdated(originalName);
      }
    }
  });
});
