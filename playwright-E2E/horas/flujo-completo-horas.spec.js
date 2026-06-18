const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getQaEnv } = require('../helpers/env');
const { getHourRegistrationData, getPhaseData } = require('../helpers/testDataFactory');
const {
  createHourRecordForUser,
  createPhaseForProject,
  deactivateCreatedPhase,
  deleteHourRecordsByDescription,
  getQaUserByEmail,
} = require('../helpers/businessDataGuards');
const { HorasPage } = require('../page-objects/HorasPage');

test.describe.serial('registro de horas', () => {
  test.use({ storageState: storageStatePath('empleado') });

  test('CP-HU27-1-E2E permite visualizar registros de horas del empleado autenticado', async ({ page }, testInfo) => {
    const qaEnv = getQaEnv();
    const employee = await getQaUserByEmail(qaEnv.users.empleado);
    const phaseData = getPhaseData(testInfo);
    const hourData = getHourRegistrationData(testInfo);
    const phase = await createPhaseForProject({
      projectName: 'Proyecto Delta',
      nombre: phaseData.nombre,
      horas_estimadas: phaseData.horas_estimadas,
    });
    await createHourRecordForUser({
      employeeEmail: qaEnv.users.empleado,
      projectName: 'Proyecto Delta',
      phaseId: phase.id_fase,
      horas: hourData.horas,
      descripcion: hourData.descripcion,
    });
    const horasPage = new HorasPage(page);

    try {
      await horasPage.goto();
      await horasPage.expectRecordVisible({
        proyecto: 'Proyecto Delta',
        fase: phase.nombre,
        descripcion: hourData.descripcion,
        horas: hourData.horas,
      });
    } finally {
      await deleteHourRecordsByDescription({
        employeeId: employee.id_usuario,
        descripcion: hourData.descripcion,
      });
      await deactivateCreatedPhase(phase.id_fase);
    }
  });

  test('CP-HU29-1-E2E permite registrar horas en una fase asignada al empleado', async ({ page }, testInfo) => {
    const phaseData = getPhaseData(testInfo);
    const hourData = getHourRegistrationData(testInfo);
    const employee = await getQaUserByEmail(getQaEnv().users.empleado);
    const phase = await createPhaseForProject({
      projectName: 'Proyecto Delta',
      nombre: phaseData.nombre,
      horas_estimadas: phaseData.horas_estimadas,
    });
    const horasPage = new HorasPage(page);

    try {
      await horasPage.createRecord({
        projectName: 'Proyecto Delta',
        phaseName: phase.nombre,
        horas: hourData.horas,
        descripcion: hourData.descripcion,
      });
    } finally {
      await deleteHourRecordsByDescription({
        employeeId: employee.id_usuario,
        descripcion: hourData.descripcion,
      });
      await deactivateCreatedPhase(phase.id_fase);
    }
  });

  test('CP-HU30-1-E2E permite editar un registro de horas del dia actual', async ({ page }, testInfo) => {
    const qaEnv = getQaEnv();
    const employee = await getQaUserByEmail(qaEnv.users.empleado);
    const phaseData = getPhaseData(testInfo);
    const initialHourData = getHourRegistrationData(testInfo);
    const updatedHourData = {
      ...getHourRegistrationData(testInfo, 'Horas QA Editadas'),
      horas: '1',
    };
    const phase = await createPhaseForProject({
      projectName: 'Proyecto Delta',
      nombre: phaseData.nombre,
      horas_estimadas: phaseData.horas_estimadas,
    });
    const initialRecord = await createHourRecordForUser({
      employeeEmail: qaEnv.users.empleado,
      projectName: 'Proyecto Delta',
      phaseId: phase.id_fase,
      horas: initialHourData.horas,
      descripcion: initialHourData.descripcion,
    });
    const horasPage = new HorasPage(page);

    try {
      await horasPage.goto();
      await horasPage.editRecordByDescription(initialRecord.descripcion, {
        projectName: 'Proyecto Delta',
        phaseName: phase.nombre,
        horas: updatedHourData.horas,
        descripcion: updatedHourData.descripcion,
      });
    } finally {
      await deleteHourRecordsByDescription({
        employeeId: employee.id_usuario,
        descripcion: updatedHourData.descripcion,
      });
      await deleteHourRecordsByDescription({
        employeeId: employee.id_usuario,
        descripcion: initialHourData.descripcion,
      });
      await deactivateCreatedPhase(phase.id_fase);
    }
  });
});
