const { expect } = require('@playwright/test');

class ServiciosPage {
  constructor(page) {
    this.page = page;
    this.moduleLink = page.locator('nav a[href="/servicios"]');
    this.totalServicesLabel = page.getByText('Total servicios');
    this.searchInput = page.getByPlaceholder('Buscar servicio...');
    this.newServiceButton = page.getByRole('button', { name: 'Nuevo Servicio' });
    this.createFormTitle = page.getByRole('heading', { name: 'Crear nuevo servicio' });
    this.nameInput = page.locator('input[name="nombre"]');
    this.descriptionInput = page.locator('textarea[name="descripcion"]');
    this.createServiceButton = page.getByRole('button', { name: 'Crear servicio' });
    this.tableRows = page.locator('tbody tr');
  }

  async gotoFromSidebar() {
    const servicesResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/servicios') && response.request().method() === 'GET'
    );

    await this.moduleLink.click();
    expect((await servicesResponse).ok()).toBeTruthy();
    await expect(this.page).toHaveURL(/\/servicios\/?$/);
  }

  async expectLoaded() {
    await expect(this.totalServicesLabel).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.newServiceButton).toBeVisible();
  }

  async createService(serviceData) {
    await this.newServiceButton.click();
    await expect(this.createFormTitle).toBeVisible();
    await this.nameInput.fill(serviceData.nombre);
    await this.descriptionInput.fill(serviceData.descripcion);

    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/servicios') && response.request().method() === 'POST'
    );
    const refreshResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/servicios') && response.request().method() === 'GET'
    );

    await this.createServiceButton.click();
    const response = await createResponse;
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body.data).toEqual(expect.objectContaining({
      id_servicio: expect.any(Number),
      nombre: serviceData.nombre,
    }));

    expect((await refreshResponse).ok()).toBeTruthy();
    await expect(this.createFormTitle).not.toBeVisible();
    return body.data;
  }

  async expectServiceVisible(service) {
    await this.searchInput.fill(service.nombre);
    const row = this.tableRows.filter({ hasText: service.nombre });

    await expect(row).toHaveCount(1);
    await expect(row).toBeVisible();
    await expect(row).toContainText(`#${service.id_servicio}`);
    await expect(row).toContainText(service.descripcion);
  }
}

module.exports = { ServiciosPage };
