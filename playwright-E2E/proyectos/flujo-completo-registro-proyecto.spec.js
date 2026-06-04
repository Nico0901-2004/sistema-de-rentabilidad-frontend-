const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getProjectRegistrationData } = require('../helpers/testDataFactory');
const { deactivateCreatedProject } = require('../helpers/businessDataGuards');
const { ProyectosPage } = require('../page-objects/ProyectosPage');

test.describe.serial('CP-HU18-1-E2E - Flujo completo registro proyecto', () => {
  test.use({ storageState: storageStatePath('propietario') });

  test('permite registrar un proyecto con datos completos', async ({ page }, testInfo) => {
    const proyectosPage = new ProyectosPage(page);
    const projectData = getProjectRegistrationData(testInfo);
    let createdProject;

    try {
      await page.goto('/dashboard');
      await proyectosPage.gotoFromSidebar();
      await proyectosPage.expectLoaded();

      await proyectosPage.openCreateForm();
      await proyectosPage.fillCreateForm(projectData);
      createdProject = await proyectosPage.submitCreateFormAndCaptureProject();

      await proyectosPage.searchProjectByName(projectData.nombre);
      await proyectosPage.expectCreatedProjectVisible(createdProject);
    } finally {
      await deactivateCreatedProject(createdProject?.id_proyecto);
    }
  });
});
