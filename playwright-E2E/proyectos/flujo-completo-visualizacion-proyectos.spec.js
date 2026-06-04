const { test, expect } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { ProyectosPage } = require('../page-objects/ProyectosPage');

test.describe.serial('CP-HU17-1-E2E - Flujo completo visualizacion proyectos', () => {
  test.use({ storageState: storageStatePath('propietario') });

  test('permite visualizar proyectos para un propietario autenticado', async ({ page }) => {
    const proyectosPage = new ProyectosPage(page);

    await page.goto('/dashboard');
    const projectsResponseBody = await proyectosPage.gotoFromSidebar();
    const projects = proyectosPage.getProjectsFromApi(projectsResponseBody);

    const seedProjectName = 'Proyecto Delta';
    const seedProject = projects.find((project) => project.nombre === seedProjectName);

    expect(seedProject, `No se encontro proyecto seed ${seedProjectName}`).toBeTruthy();
    proyectosPage.expectProjectFieldsAreValid([seedProject]);
    await proyectosPage.expectLoaded();
    await proyectosPage.expectProjectFromApiVisibleByName(projects, seedProjectName);
  });
});
