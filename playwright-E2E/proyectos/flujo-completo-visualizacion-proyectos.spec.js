const { test } = require('@playwright/test');
const { loginAs } = require('../helpers/auth');
const { ProyectosPage } = require('../page-objects/ProyectosPage');

test.describe('CP-HU17-1-E2E - Flujo completo visualizacion proyectos', () => {
  test('permite login propietario y visualizar proyectos correctamente', async ({ page }) => {
    const proyectosPage = new ProyectosPage(page);

    await loginAs(page, 'propietario');
    const projectsResponseBody = await proyectosPage.gotoFromSidebar();
    const projects = proyectosPage.getProjectsFromApi(projectsResponseBody);

    proyectosPage.expectProjectFieldsAreValid(projects);
    await proyectosPage.expectLoaded();
    await proyectosPage.expectProjectsFromApiVisible(projects);
  });
});
