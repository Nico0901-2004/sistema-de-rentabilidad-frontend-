const { expect } = require('@playwright/test');

class NotasPage {
  constructor(page) {
    this.page = page;
    this.moduleLink = page.locator('nav a[href="/notas"]');
    this.createNoteButton = page.getByRole('button', { name: 'Crear nota' });
    this.createFormTitle = page.getByRole('heading', { name: 'Nueva nota' });
    this.projectSelect = page.locator('form select[name="id_proyecto"]');
    this.descriptionInput = page.locator('textarea[name="descripcion"]');
    this.submitButton = page.getByRole('button', { name: 'Registrar nota' });
    this.projectFilter = page.locator('select:not([name])');
    this.tableRows = page.locator('tbody tr');
  }

  async gotoFromSidebar() {
    const projectsResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/proyectos') && response.request().method() === 'GET'
    );

    await this.moduleLink.click();
    expect((await projectsResponse).ok()).toBeTruthy();
    await expect(this.page).toHaveURL(/\/notas\/?$/);
    await expect(this.createNoteButton).toBeVisible();
    await expect(this.projectFilter).toBeVisible();
  }

  async createNote(noteData) {
    await this.createNoteButton.click();
    await expect(this.createFormTitle).toBeVisible();
    await this.projectSelect.selectOption({ label: noteData.proyecto });
    const projectId = await this.projectSelect.inputValue();
    await this.descriptionInput.fill(noteData.descripcion);

    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes(`/api/proyectos/${projectId}/notas`) && response.request().method() === 'POST'
    );
    const refreshResponse = this.page.waitForResponse(
      (response) => response.url().includes(`/api/proyectos/${projectId}/notas`) && response.request().method() === 'GET'
    );

    await this.submitButton.click();
    const response = await createResponse;
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body.data).toEqual(expect.objectContaining({
      id_nota: expect.any(Number),
      descripcion: noteData.descripcion,
    }));

    expect((await refreshResponse).ok()).toBeTruthy();
    await expect(this.createFormTitle).not.toBeVisible();
    return body.data;
  }

  async expectNoteVisible(noteData) {
    await this.projectFilter.selectOption({ label: noteData.proyecto });
    const row = this.tableRows.filter({ hasText: noteData.descripcion });

    await expect(row).toHaveCount(1);
    await expect(row).toBeVisible();
    await expect(row).toContainText(noteData.proyecto);
    await expect(row).toContainText(noteData.descripcion);
  }
}

module.exports = { NotasPage };
