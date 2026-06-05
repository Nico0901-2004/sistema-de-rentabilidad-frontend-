const { test } = require('../fixtures/e2eTest');
const { storageStateForUser } = require('../helpers/authState');
const { getQaEnv } = require('../helpers/env');
const { getHourRegistrationData, getMarcajeEmployeeData, getPhaseData } = require('../helpers/testDataFactory');
const {
  cleanupMarcajeEmployee,
  createMonthlyEmployeeForMarcaje,
  createPhaseForProject,
  deactivateCreatedPhase,
  resetTodayMarcajeForUser,
  seedCompletedMarcajeForToday,
  seedOpenMarcajeForToday,
} = require('../helpers/businessDataGuards');
const { MarcajesPage } = require('../page-objects/MarcajesPage');

const withMonthlyEmployeePage = async (browser, testInfo, callback) => {
  const employeeData = getMarcajeEmployeeData(testInfo);
  let user;
  let context;

  try {
    user = await createMonthlyEmployeeForMarcaje(employeeData);
    await resetTodayMarcajeForUser(user.id_usuario);

    const storageState = await storageStateForUser(user, testInfo);
    context = await browser.newContext({
      baseURL: getQaEnv().frontendUrl,
      storageState,
    });

    const page = await context.newPage();

    await callback({ page, user });
  } finally {
    await context?.close();
    await cleanupMarcajeEmployee({
      userId: user?.id_usuario,
      email: user?.email || employeeData.email,
    });
  }
};

test.describe.serial('marcajes con empleado mensual temporal', () => {
  test('CP-HU21-1-E2E permite registrar entrada para un empleado mensual autenticado', async ({ browser }, testInfo) => {
    await withMonthlyEmployeePage(browser, testInfo, async ({ page }) => {
      const marcajesPage = new MarcajesPage(page);

      await marcajesPage.gotoHome();
      await marcajesPage.registerEntry();
      await marcajesPage.gotoList();
      await marcajesPage.expectSingleMarcajeWithStatus('Jornada Activa');
    });
  });

  test('CP-HU25-1-E2E permite registrar salida para un empleado mensual autenticado', async ({ browser }, testInfo) => {
    await withMonthlyEmployeePage(browser, testInfo, async ({ page, user }) => {
      const phaseData = getPhaseData(testInfo);
      const hourData = getHourRegistrationData(testInfo, 'Marcaje salida');
      const phase = await createPhaseForProject({
        projectName: 'Proyecto Delta',
        nombre: phaseData.nombre,
        horas_estimadas: phaseData.horas_estimadas,
      });
      const marcajesPage = new MarcajesPage(page);

      try {
        await seedOpenMarcajeForToday(user.id_usuario);
        await marcajesPage.gotoHome();
        await marcajesPage.registerExitWithHours({
          projectName: 'Proyecto Delta',
          phaseName: phase.nombre,
          horas: hourData.horas,
          descripcion: hourData.descripcion,
        });
        await marcajesPage.gotoList();
        await marcajesPage.expectSingleMarcajeWithStatus('Completado');
      } finally {
        await deactivateCreatedPhase(phase.id_fase);
      }
    });
  });

  test('CP-HU31-1-E2E permite visualizar el historial de marcajes del empleado mensual', async ({ browser }, testInfo) => {
    await withMonthlyEmployeePage(browser, testInfo, async ({ page, user }) => {
      const marcajesPage = new MarcajesPage(page);

      await seedCompletedMarcajeForToday(user.id_usuario);
      await marcajesPage.gotoList();
      await marcajesPage.expectSingleMarcajeWithStatus('Completado');
    });
  });
});
