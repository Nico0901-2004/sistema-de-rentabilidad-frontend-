const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getPhaseData } = require('../helpers/testDataFactory');
const {
  createPhaseForProject,
  deactivateCreatedPhase,
  getProjectByName,
} = require('../helpers/businessDataGuards');
const { FasesPage } = require('../page-objects/FasesPage');

test.describe.serial('fases de proyecto', () => {
  test.use({ storageState: storageStatePath('propietario') });

  test('CP-HU35-1-E2E permite visualizar fases de un proyecto autenticado', async ({ page }) => {
    const project = await getProjectByName('Proyecto Delta');
    const fasesPage = new FasesPage(page);

    await fasesPage.gotoProject(project.id_proyecto);
    await fasesPage.expectSeedPhasesVisible(['Planificación', 'Ejecución QA']);
  });

  test('CP-HU36-1-E2E permite registrar una fase para un proyecto', async ({ page }, testInfo) => {
    const project = await getProjectByName('Proyecto Delta');
    const phaseData = getPhaseData(testInfo);
    const fasesPage = new FasesPage(page);
    let createdPhase;

    try {
      await fasesPage.gotoProject(project.id_proyecto);
      createdPhase = await fasesPage.createPhase(phaseData);
      await fasesPage.expectPhaseVisible(createdPhase);
    } finally {
      await deactivateCreatedPhase(createdPhase?.id_fase);
    }
  });

  test('CP-HU37-1-E2E permite editar una fase existente', async ({ page }, testInfo) => {
    const initialPhaseData = getPhaseData(testInfo);
    const updatedPhaseData = {
      ...getPhaseData(testInfo, 'Fase QA Editada'),
      horas_estimadas: '18.5',
    };
    const createdPhase = await createPhaseForProject({
      projectName: 'Proyecto Delta',
      nombre: initialPhaseData.nombre,
      horas_estimadas: initialPhaseData.horas_estimadas,
    });
    const fasesPage = new FasesPage(page);

    try {
      await fasesPage.gotoProject(createdPhase.id_proyecto);
      const updatedPhase = await fasesPage.editPhaseByName(initialPhaseData.nombre, updatedPhaseData);

      await fasesPage.expectPhaseVisible({
        nombre: updatedPhaseData.nombre,
        horas_estimadas: updatedPhaseData.horas_estimadas,
      });
      await deactivateCreatedPhase(updatedPhase?.id_fase);
    } finally {
      await deactivateCreatedPhase(createdPhase.id_fase);
    }
  });
});
