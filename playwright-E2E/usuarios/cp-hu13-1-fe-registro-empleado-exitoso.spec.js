const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getEmployeeRegistrationData } = require('../helpers/testDataFactory');
const { cleanupCreatedEmployee } = require('../helpers/businessDataGuards');
const { UsuariosPage } = require('../page-objects/UsuariosPage');

test.describe.serial('CP-HU13-1-FE - Registro empleado exitoso', () => {
  test.use({ storageState: storageStatePath('propietario') });

  test('permite registrar un empleado con datos válidos', async ({ page }, testInfo) => {
    const usuariosPage = new UsuariosPage(page);
    const employeeData = getEmployeeRegistrationData(testInfo);
    let createdEmployee;

    try {
      await page.goto('/dashboard');
      await usuariosPage.gotoFromSidebar();

      createdEmployee = await usuariosPage.createEmployee(employeeData);
      await usuariosPage.expectEmployeeVisible(employeeData, createdEmployee);
    } finally {
      await cleanupCreatedEmployee({
        userId: createdEmployee?.id,
        email: employeeData.email,
      });
    }
  });
});
