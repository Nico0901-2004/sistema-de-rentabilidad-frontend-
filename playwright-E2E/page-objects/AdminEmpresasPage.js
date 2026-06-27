const { expect } = require('@playwright/test');

class AdminEmpresasPage {
  constructor(page) {
    this.page = page;
    this.moduleLink = page.locator('nav a[href="/empresas"]');
    this.totalCompaniesLabel = page.getByText('Total empresas');
    this.searchInput = page.getByPlaceholder('Buscar empresa...');
    this.newCompanyButton = page.getByRole('button', { name: 'Nueva Empresa' });
    this.createFormTitle = page.getByRole('heading', { name: 'Crear Empresa' });
    this.nameInput = page.getByPlaceholder('Ej: Empresa ABC');
    this.createCompanyButton = page.getByRole('button', { name: 'Crear empresa' });
  }

  async gotoFromSidebar() {
    const companiesResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/empresas') && response.request().method() === 'GET'
    );

    await this.moduleLink.click();
    expect((await companiesResponse).ok()).toBeTruthy();
    await expect(this.page).toHaveURL(/\/empresas\/?$/);
  }

  async expectLoaded() {
    await expect(this.totalCompaniesLabel).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.newCompanyButton).toBeVisible();
  }

  async createCompany(companyData) {
    await this.newCompanyButton.click();
    await expect(this.createFormTitle).toBeVisible();
    await this.nameInput.fill(companyData.nombre);

    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/empresas') && response.request().method() === 'POST'
    );
    const refreshResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/empresas') && response.request().method() === 'GET'
    );

    await this.createCompanyButton.click();
    const response = await createResponse;
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body.data).toEqual(expect.objectContaining({
      id_empresa: expect.any(Number),
      nombre: companyData.nombre,
    }));

    expect((await refreshResponse).ok()).toBeTruthy();
    await expect(this.createFormTitle).not.toBeVisible();
    return body.data;
  }

  async expectCompanyVisible(company) {
    await this.searchInput.fill(company.nombre);
    const cardTitle = this.page.getByRole('heading', { name: company.nombre, exact: true });

    await expect(cardTitle).toHaveCount(1);
    await expect(cardTitle).toBeVisible();
    await expect(cardTitle.locator('xpath=ancestor::div[contains(@class,"card")][1]'))
      .toContainText(`ID #${company.id_empresa}`);
  }
}

module.exports = { AdminEmpresasPage };
