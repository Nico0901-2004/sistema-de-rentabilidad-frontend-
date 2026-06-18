const { expect } = require('@playwright/test');

class HorasPage {
  constructor(page) {
    this.page = page;
    this.totalRecordsLabel = page.getByText('Total Registros');
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    this.projectSelect = page.locator('select[name="id_proyecto"]');
    this.phaseSelect = page.locator('select[name="id_fase"]');
    this.hoursInput = page.locator('input[name="horas"]');
    this.descriptionInput = page.locator('textarea[name="descripcion"]');
    this.formTitle = page.getByRole('heading', { name: /Registrar Horas|Editar Horas/i });
  }

  async goto() {
    const horasResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/horas') && response.request().method() === 'GET'
    );

    await this.page.goto('/mis-horas');
    const response = await horasResponse;

    expect(response.ok()).toBeTruthy();
    await expect(this.totalRecordsLabel).toBeVisible();
    await expect(this.table).toBeVisible();

    return response.json();
  }

  async gotoWithCreateForm() {
    const horasResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/horas') && response.request().method() === 'GET'
    );
    const projectsResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/proyectos') && response.request().method() === 'GET'
    );

    await this.page.goto('/mis-horas?registrar=true');

    expect((await horasResponse).ok()).toBeTruthy();
    expect((await projectsResponse).ok()).toBeTruthy();
    await expect(this.formTitle).toHaveText(/Registrar Horas/i);
  }

  rowByDescription(description) {
    return this.tableRows.filter({ hasText: description });
  }

  async expectRecordVisible({ proyecto, fase, descripcion, horas }) {
    const row = this.rowByDescription(descripcion);

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(descripcion);

    if (proyecto) await expect(row.first()).toContainText(proyecto);
    if (fase) await expect(row.first()).toContainText(fase);
    if (horas !== undefined) await expect(row.first()).toContainText(`${Number(horas).toFixed(1)}h`);
  }

  async expectSeedDescriptionsVisible(descriptions) {
    for (const description of descriptions) {
      await expect(this.rowByDescription(description).first()).toBeVisible();
    }
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

  async fillForm({ projectName, phaseName, horas, descripcion }) {
    if (projectName && await this.projectSelect.isEnabled()) {
      const fasesResponse = this.page.waitForResponse(
        (response) => response.url().includes('/api/proyectos/') && response.url().includes('/fases') && response.request().method() === 'GET'
      );

      await this.selectOptionByLabel(this.projectSelect, projectName);
      expect((await fasesResponse).ok()).toBeTruthy();
    }

    if (phaseName && await this.phaseSelect.isEnabled()) {
      await this.selectOptionByLabel(this.phaseSelect, phaseName);
    }

    await this.hoursInput.fill(String(horas));
    await this.descriptionInput.fill(descripcion);
  }

  async submitCreateForm() {
    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/horas') && response.request().method() === 'POST'
    );

    await this.page.getByRole('button', { name: /Confirmar Registro/i }).click();
    const response = await createResponse;

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body).toHaveProperty('success', true);
    await expect(this.formTitle).not.toBeVisible();

    return body.data;
  }

  async createRecord(data) {
    await this.gotoWithCreateForm();
    await this.fillForm(data);
    const record = await this.submitCreateForm();
    await this.expectRecordVisible({
      proyecto: data.projectName,
      fase: data.phaseName,
      descripcion: data.descripcion,
      horas: data.horas,
    });

    return record;
  }

  async openEditFormByDescription(description) {
    const row = this.rowByDescription(description);

    await expect(row).toHaveCount(1);
    await row.first().locator('button[title="Editar registro de hoy"]').click();

    await expect(this.formTitle).toHaveText(/Editar Horas/i);
    await expect(this.descriptionInput).toHaveValue(description);
  }

  async submitEditForm() {
    const updateResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/horas/') && response.request().method() === 'PUT'
    );

    await this.page.getByRole('button', { name: /Guardar Cambios/i }).click();
    const response = await updateResponse;

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body).toHaveProperty('success', true);
    await expect(this.formTitle).not.toBeVisible();

    return body.data;
  }

  async editRecordByDescription(currentDescription, data) {
    await this.openEditFormByDescription(currentDescription);
    await this.fillForm(data);
    const record = await this.submitEditForm();
    await this.expectRecordVisible({
      proyecto: data.projectName,
      fase: data.phaseName,
      descripcion: data.descripcion,
      horas: data.horas,
    });

    return record;
  }
}

module.exports = {
  HorasPage,
};
