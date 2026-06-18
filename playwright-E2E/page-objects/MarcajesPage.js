const { expect } = require('@playwright/test');

class MarcajesPage {
  constructor(page) {
    this.page = page;
    this.entryButton = page.getByRole('button', { name: /Marcar Entrada/i });
    this.exitButton = page.getByRole('button', { name: /Marcar Salida/i });
    this.finishedButton = page.getByRole('button', { name: /Jornada Finalizada/i });
    this.heading = page.getByRole('heading', { name: 'Mis Marcajes' });
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    this.projectSelect = page.locator('.modal-card select').first();
    this.phaseSelect = page.locator('.modal-card select').nth(1);
    this.modalHoursInput = page.locator('.modal-card input[type="number"]').first();
    this.modalDescriptionInput = page.locator('.modal-card input[type="text"]').first();
    this.modalSubmitButton = page.getByRole('button', { name: /Guardar Horas y Registrar Salida/i });
  }

  async clearMarcajeLocalStorage() {
    await this.page.addInitScript(() => {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('marcaje_')) {
          window.localStorage.removeItem(key);
        }
      }
    });
  }

  async gotoHome() {
    await this.clearMarcajeLocalStorage();
    const marcajesResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/marcajes') && response.request().method() === 'GET'
    );

    await this.page.goto('/mi-espacio');
    const response = await marcajesResponse;

    expect(response.ok()).toBeTruthy();
  }

  async gotoList() {
    const marcajesResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/marcajes') && response.request().method() === 'GET'
    );

    await this.page.goto('/mis-marcajes');
    const response = await marcajesResponse;

    expect(response.ok()).toBeTruthy();
    await expect(this.heading).toBeVisible();
    await expect(this.table).toBeVisible();

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  rowByStatus(status) {
    return this.tableRows.filter({ hasText: status });
  }

  async expectSingleMarcajeWithStatus(status) {
    const row = this.rowByStatus(status);

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(status);
  }

  async registerEntry() {
    const entryResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/marcajes/entrada') && response.request().method() === 'POST'
    );

    await this.entryButton.click();
    const response = await entryResponse;

    expect(response.ok()).toBeTruthy();
    await expect(this.exitButton).toBeVisible();

    return response.json();
  }

  async selectOptionByLabel(selectLocator, label) {
    await expect
      .poll(async () => (
        selectLocator.locator('option').evaluateAll(
          (options, expectedLabel) => options.some((option) => option.textContent.trim() === expectedLabel),
          label
        )
      ))
      .toBeTruthy();

    await selectLocator.selectOption({ label });
  }

  async openExitHoursModal() {
    const projectsResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/proyectos') && response.request().method() === 'GET'
    );

    await this.exitButton.click();
    expect((await projectsResponse).ok()).toBeTruthy();
    await expect(this.page.getByRole('heading', { name: 'Imputación Diaria de Tiempos' })).toBeVisible();
  }

  async fillExitHours({ projectName, phaseName, horas, descripcion }) {
    const fasesResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/proyectos/') && response.url().includes('/fases') && response.request().method() === 'GET'
    );

    await this.selectOptionByLabel(this.projectSelect, projectName);
    expect((await fasesResponse).ok()).toBeTruthy();

    await this.selectOptionByLabel(this.phaseSelect, phaseName);
    await this.modalHoursInput.fill(String(horas));
    await this.modalDescriptionInput.fill(descripcion);
  }

  async submitExitWithHours() {
    const hourResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/horas') && response.request().method() === 'POST'
    );
    const exitResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/marcajes/salida') && response.request().method() === 'POST'
    );

    await this.modalSubmitButton.click();

    expect((await hourResponse).status()).toBe(201);
    expect((await exitResponse).ok()).toBeTruthy();
  }

  async registerExitWithHours(data) {
    await this.openExitHoursModal();
    await this.fillExitHours(data);
    await this.submitExitWithHours();
    await expect(this.page).toHaveURL(/\/mis-horas\/?$/);
  }
}

module.exports = {
  MarcajesPage,
};
