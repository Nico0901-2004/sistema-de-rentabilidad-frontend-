const { expect } = require('@playwright/test');

class FasesPage {
  constructor(page) {
    this.page = page;
    this.totalPhasesLabel = page.getByText('Total fases');
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    this.newPhaseButton = page.getByRole('button', { name: /Nueva Fase/i });
    this.formTitle = page.getByRole('heading', { name: /Nueva fase|Editar fase/i });
    this.nameInput = page.locator('input[name="nombre"]');
    this.estimatedHoursInput = page.locator('input[name="horas_estimadas"]');
  }

  async gotoProject(projectId) {
    const fasesResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes(`/api/proyectos/${projectId}/fases`) &&
        response.request().method() === 'GET'
    );

    await this.page.goto(`/proyectos/${projectId}/fases`);
    const response = await fasesResponse;

    expect(response.ok()).toBeTruthy();
    await expect(this.totalPhasesLabel).toBeVisible();
    await expect(this.table).toBeVisible();

    return response.json();
  }

  rowByName(name) {
    return this.tableRows.filter({ hasText: name });
  }

  async expectPhaseVisible({ nombre, horas_estimadas }) {
    const row = this.rowByName(nombre);

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(nombre);

    if (horas_estimadas !== undefined) {
      await expect(row.first()).toContainText(`${Number(horas_estimadas).toFixed(1)}h`);
    }
  }

  async expectSeedPhasesVisible(names) {
    for (const name of names) {
      await this.expectPhaseVisible({ nombre: name });
    }
  }

  async openCreateForm() {
    await this.newPhaseButton.click();
    await expect(this.formTitle).toHaveText(/Nueva fase/i);
    await expect(this.nameInput).toBeVisible();
  }

  async fillForm({ nombre, horas_estimadas }) {
    await this.nameInput.fill(nombre);
    await this.estimatedHoursInput.fill(String(horas_estimadas));
  }

  async submitCreateForm() {
    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/proyectos/') && response.url().includes('/fases') && response.request().method() === 'POST'
    );

    await this.page.getByRole('button', { name: 'Crear fase' }).click();
    const response = await createResponse;

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    await expect(this.formTitle).not.toBeVisible();

    return body.data;
  }

  async createPhase(data) {
    await this.openCreateForm();
    await this.fillForm(data);
    const phase = await this.submitCreateForm();
    await this.expectPhaseVisible(phase);

    return phase;
  }

  async openEditFormByName(name) {
    const row = this.rowByName(name);

    await expect(row).toHaveCount(1);

    const loadResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/fases/') && response.request().method() === 'GET'
    );

    await row.first().locator('button[title="Editar"]').click();
    const response = await loadResponse;

    expect(response.ok()).toBeTruthy();
    await expect(this.formTitle).toHaveText(/Editar fase/i);
  }

  async submitEditForm() {
    const updateResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/fases/') && response.request().method() === 'PUT'
    );
    const refreshResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/proyectos/') &&
        response.url().includes('/fases') &&
        response.request().method() === 'GET'
    );

    await this.page.getByRole('button', { name: 'Actualizar fase' }).click();
    const response = await updateResponse;

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body).toHaveProperty('success', true);
    expect((await refreshResponse).ok()).toBeTruthy();
    await expect(this.formTitle).not.toBeVisible();

    return body.data;
  }

  async editPhaseByName(currentName, data) {
    await this.openEditFormByName(currentName);
    await this.fillForm(data);
    const phase = await this.submitEditForm();
    await this.expectPhaseVisible(phase);

    return phase;
  }
}

module.exports = {
  FasesPage,
};
