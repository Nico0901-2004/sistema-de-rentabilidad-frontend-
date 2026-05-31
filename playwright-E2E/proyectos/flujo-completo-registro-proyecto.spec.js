const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { getProjectRegistrationData } = require('../helpers/testDataFactory');
const { ProyectosPage } = require('../page-objects/ProyectosPage');

test.describe('CP-HU18-1-E2E - Flujo completo registro proyecto', () => {
  test('permite registrar un proyecto con datos completos', async ({ page }) => {
    const proyectosPage = new ProyectosPage(page);
    const projectData = getProjectRegistrationData();
    let createdProject;

    try {
      await loginAs(page, 'propietario');
      await proyectosPage.gotoFromSidebar();
      await proyectosPage.expectLoaded();

      await proyectosPage.openCreateForm();
      await proyectosPage.fillCreateForm(projectData);
      createdProject = await proyectosPage.submitCreateFormAndCaptureProject();

      await proyectosPage.searchProjectByName(projectData.nombre);
      await proyectosPage.expectCreatedProjectVisible(createdProject);
    } finally {
      await proyectosPage.cleanupCreatedProjectByApi(createdProject?.id_proyecto);
    }
  });
});
