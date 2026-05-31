const { expect } = require('@playwright/test');
const { getQaEnv } = require('../helpers/env');

const DEFAULT_PAGE_SIZE = 6;

class AdminPropietariosPage {
  constructor(page) {
    this.page = page;
    this.moduleLink = page.locator('nav a[href="/propietarios"]');
    this.searchInput = page.getByPlaceholder('Buscar por nombre, email o empresa...');
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    this.totalOwnersLabel = page.getByText('Total propietarios');
    this.newOwnerButton = page.getByRole('button', { name: /Nuevo Propietario/i });
    this.createFormTitle = page.getByRole('heading', { name: 'Crear propietario' });
    this.companySelect = page.locator('select[name="id_empresa"]');
    this.nameInput = page.locator('input[name="nombre"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.createOwnerButton = page.getByRole('button', { name: /Crear propietario/i });
    this.cancelButton = page.getByRole('button', { name: 'Cancelar' });
    this.createdAlert = page.getByText('Propietario creado.');
  }

  async expectAdminHome() {
    await expect(this.page).toHaveURL(/\/admin-dashboard\/?$/);
  }

  async gotoFromSidebar() {
    const ownersResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/usuarios') && response.request().method() === 'GET'
    );

    await this.moduleLink.click();
    const response = await ownersResponse;

    expect(response.ok()).toBeTruthy();
    await expect(this.page).toHaveURL(/\/propietarios\/?$/);

    return response.json();
  }

  async expectLoaded() {
    await expect(this.totalOwnersLabel).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.table).toBeVisible();
  }

  async openCreateForm() {
    const companiesResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/empresas') && response.request().method() === 'GET'
    );
    const ownersResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/usuarios') && response.request().method() === 'GET'
    );

    await this.newOwnerButton.click();

    expect((await companiesResponse).ok()).toBeTruthy();
    expect((await ownersResponse).ok()).toBeTruthy();
    await this.expectCreateFormVisible();
  }

  async expectCreateFormVisible() {
    await expect(this.createFormTitle).toBeVisible();
    await expect(this.companySelect).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.createOwnerButton).toBeVisible();
  }

  async getAvailableCompanyOptions() {
    return this.companySelect.locator('option').evaluateAll((options) =>
      options
        .filter((option) => option.value)
        .map((option) => ({
          value: option.value,
          label: option.textContent.trim(),
        }))
    );
  }

  async createTemporaryCompanyByApi(companyData) {
    const { backendUrl } = getQaEnv();
    const response = await this.page.request.post(`${backendUrl}/api/empresas`, {
      data: companyData,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');

    return {
      value: String(body.data.id_empresa),
      label: body.data.nombre || companyData.nombre,
    };
  }

  async selectCompanyByName(companyName) {
    await expect
      .poll(async () => {
        const options = await this.getAvailableCompanyOptions();

        return options.some((option) => option.label === companyName);
      })
      .toBeTruthy();

    await this.companySelect.selectOption({ label: companyName });

    const selectedCompany = (await this.getAvailableCompanyOptions())
      .find((option) => option.label === companyName);

    expect(selectedCompany).toBeTruthy();

    return selectedCompany;
  }

  async selectFirstAvailableCompanyOrCreateOne(companyData) {
    const companies = await this.getAvailableCompanyOptions();

    if (companies.length > 0) {
      const [company] = companies;

      await this.companySelect.selectOption(company.value);

      return company;
    }

    const company = await this.createTemporaryCompanyByApi(companyData);

    await this.cancelButton.click();
    await expect(this.createFormTitle).not.toBeVisible();
    await this.openCreateForm();

    return this.selectCompanyByName(company.label);
  }

  async fillOwnerForm(ownerData) {
    await this.nameInput.fill(ownerData.nombre);
    await expect(this.nameInput).toHaveValue(ownerData.nombre);

    await this.emailInput.fill(ownerData.email);
    await expect(this.emailInput).toHaveValue(ownerData.email);

    await this.passwordInput.fill(ownerData.password);
    await expect(this.passwordInput).toHaveValue(ownerData.password);
  }

  async submitCreateFormAndCaptureOwner() {
    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/usuarios') && response.request().method() === 'POST'
    );

    await this.createOwnerButton.click();
    const response = await createResponse;

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('user');
    expect(body.user).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        nombre: expect.any(String),
        email: expect.any(String),
      })
    );

    await expect(this.createdAlert).toBeVisible();
    await expect(this.createFormTitle).not.toBeVisible();

    return body.user;
  }

  getOwnersFromApi(responseBody) {
    expect(responseBody.success).toBeTruthy();
    const owners = responseBody.data || [];

    expect(Array.isArray(owners)).toBeTruthy();
    expect(owners.length).toBeGreaterThan(0);

    return owners.filter((owner) => owner?.is_active !== false && owner?.activo !== false);
  }

  expectOwnerFieldsAreValid(owners) {
    for (const owner of owners) {
      expect(owner).toEqual(
        expect.objectContaining({
          id_usuario: expect.any(Number),
          nombre: expect.any(String),
          email: expect.any(String),
          id_empresa: expect.any(Number),
        })
      );
      expect(owner.nombre.trim()).not.toBe('');
      expect(owner.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  }

  rowForOwner(owner) {
    return this.tableRows.filter({ hasText: owner.email });
  }

  expectedCompanyText(owner) {
    return owner.empresa_nombre || 'Sin empresa';
  }

  async expectOwnerRowMatchesApi(owner) {
    const row = this.rowForOwner(owner);

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(`#${owner.id_usuario}`);
    await expect(row.first()).toContainText(owner.nombre);
    await expect(row.first()).toContainText(owner.email);
    await expect(row.first()).toContainText(this.expectedCompanyText(owner));
  }

  async expectOwnersFromApiVisible(owners) {
    const expectedVisibleRows = Math.min(owners.length, DEFAULT_PAGE_SIZE);

    await expect(this.tableRows).toHaveCount(expectedVisibleRows);

    const tableBodyText = await this.table.locator('tbody').innerText();
    const visibleOwners = owners.filter((owner) => tableBodyText.includes(owner.email));

    expect(visibleOwners.length).toBe(expectedVisibleRows);
    for (const owner of visibleOwners) {
      await this.expectOwnerRowMatchesApi(owner);
    }
  }

  async searchFirstOwnerFromApi(owners) {
    const [owner] = owners;

    await this.searchInput.fill(owner.email);

    await expect(this.tableRows).toHaveCount(1);
    await this.expectOwnerRowMatchesApi(owner);
  }

  async searchOwnerByEmail(email) {
    await this.searchInput.fill(email);
  }

  async expectCreatedOwnerVisible(ownerData, companyName) {
    const row = this.tableRows.filter({ hasText: ownerData.email });

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(ownerData.nombre);
    await expect(row.first()).toContainText(ownerData.email);
    await expect(row.first()).toContainText(companyName);
  }
}

module.exports = {
  AdminPropietariosPage,
};
