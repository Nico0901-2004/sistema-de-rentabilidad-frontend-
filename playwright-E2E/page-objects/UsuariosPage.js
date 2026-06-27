const { expect } = require('@playwright/test');

class UsuariosPage {
  constructor(page) {
    this.page = page;
    this.moduleLink = page.locator('nav a[href="/usuarios"]');
    this.searchInput = page.getByPlaceholder('Buscar por nombre o email...');
    this.newUserButton = page.getByRole('button', { name: 'Nuevo Usuario' });
    this.createFormTitle = page.getByRole('heading', { name: 'Nuevo usuario' });
    this.nameInput = page.locator('input[name="nombre"]');
    this.roleSelect = page.locator('select[name="rol"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.amountInput = page.locator('input[name="monto"]');
    this.paymentTypeSelect = page.locator('select[name="tipo_pago"]');
    this.monthlyHoursInput = page.locator('input[name="horas_mensuales"]');
    this.createUserButton = page.getByRole('button', { name: 'Crear usuario' });
    this.tableRows = page.locator('tbody tr');
  }

  async gotoFromSidebar() {
    const usersResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/usuarios') && response.request().method() === 'GET'
    );

    await this.moduleLink.click();
    expect((await usersResponse).ok()).toBeTruthy();
    await expect(this.page).toHaveURL(/\/usuarios\/?$/);
    await expect(this.searchInput).toBeVisible();
    await expect(this.newUserButton).toBeVisible();
  }

  async createEmployee(employeeData) {
    await this.newUserButton.click();
    await expect(this.createFormTitle).toBeVisible();
    await this.nameInput.fill(employeeData.nombre);
    await this.roleSelect.selectOption(employeeData.rol);
    await this.emailInput.fill(employeeData.email);
    await this.passwordInput.fill(employeeData.password);
    await this.amountInput.fill(employeeData.monto);
    await this.paymentTypeSelect.selectOption(employeeData.tipo_pago);
    await this.monthlyHoursInput.fill(employeeData.horas_mensuales);

    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/usuarios') && response.request().method() === 'POST'
    );
    const refreshResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/usuarios') && response.request().method() === 'GET'
    );

    await this.createUserButton.click();
    const response = await createResponse;
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body.user).toEqual(expect.objectContaining({
      id: expect.any(Number),
      nombre: employeeData.nombre,
      email: employeeData.email,
      rol: 'empleado',
    }));

    expect((await refreshResponse).ok()).toBeTruthy();
    await expect(this.createFormTitle).not.toBeVisible();
    return body.user;
  }

  async expectEmployeeVisible(employeeData, createdEmployee) {
    await this.searchInput.fill(employeeData.email);
    const row = this.tableRows.filter({ hasText: employeeData.email });

    await expect(row).toHaveCount(1);
    await expect(row).toBeVisible();
    await expect(row).toContainText(`#${createdEmployee.id}`);
    await expect(row).toContainText(employeeData.nombre);
    await expect(row).toContainText('Empleado');
  }
}

module.exports = { UsuariosPage };
