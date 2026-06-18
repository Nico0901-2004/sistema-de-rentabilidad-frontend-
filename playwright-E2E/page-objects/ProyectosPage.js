const { expect } = require('@playwright/test');
const { getQaEnv } = require('../helpers/env');

const DEFAULT_PAGE_SIZE = 6;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ProyectosPage {
  constructor(page) {
    this.page = page;
    this.moduleLink = page.locator('nav a', { hasText: 'Proyectos' });
    this.totalProjectsLabel = page.getByText('Total proyectos');
    this.searchInput = page.getByPlaceholder('Proyecto, servicio o líder...');
    this.table = page.locator('table');
    this.tableBody = page.locator('tbody');
    this.tableRows = page.locator('tbody tr');
    this.newProjectButton = page.getByRole('button', { name: /Nuevo Proyecto/i });
    this.createFormTitle = page.getByRole('heading', { name: 'Nuevo proyecto' });
    this.nameInput = page.locator('input[name="nombre"]');
    this.descriptionInput = page.locator('textarea[name="descripcion"]');
    this.serviceSelect = page.locator('select[name="id_servicio"]');
    this.leaderSelect = page.locator('select[name="id_lider"]');
    this.budgetInput = page.locator('input[name="presupuesto"]');
    this.marginInput = page.locator('input[name="margen"]');
    this.startDateInput = page.locator('input[name="fecha_inicio"]');
    this.endDateInput = page.locator('input[name="fecha_fin_estimada"]');
    this.employeeOptions = page.locator('form .border.rounded-3.p-2.bg-light > div');
    this.createProjectButton = page.getByRole('button', { name: 'Crear Proyecto' });
  }

  async gotoFromSidebar() {
    const projectsResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/proyectos') &&
        response.request().method() === 'GET'
    );

    await this.moduleLink.click();
    const response = await projectsResponse;

    expect(response.ok()).toBeTruthy();
    await expect(this.page).toHaveURL(/\/proyectos\/?$/);

    return response.json();
  }

  async expectLoaded() {
    await expect(this.totalProjectsLabel).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.table).toBeVisible();
  }

  async openCreateForm() {
    const serviciosResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/servicios') && response.request().method() === 'GET'
    );
    const usuariosResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/usuarios') && response.request().method() === 'GET'
    );

    await this.newProjectButton.click();

    expect((await serviciosResponse).ok()).toBeTruthy();
    expect((await usuariosResponse).ok()).toBeTruthy();
    await this.expectCreateFormVisible();
  }

  async expectCreateFormVisible() {
    await expect(this.createFormTitle).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.serviceSelect).toBeVisible();
    await expect(this.leaderSelect).toBeVisible();
    await expect(this.createProjectButton).toBeVisible();
  }

  async selectFirstNonEmptyOption(selectLocator, fieldName) {
    await expect
      .poll(async () => (
        selectLocator.locator('option').evaluateAll((options) =>
          options.filter((option) => option.value).length
        )
      ))
      .toBeGreaterThan(0);

    const option = await selectLocator.locator('option').evaluateAll((options) => {
      const selected = options.find((item) => item.value);

      return selected
        ? { value: selected.value, label: selected.textContent.trim() }
        : null;
    });

    expect(option, `No hay opciones disponibles para ${fieldName}`).toBeTruthy();
    await selectLocator.selectOption(option.value);

    return option;
  }

  async selectFirstAvailableService() {
    return this.selectFirstNonEmptyOption(this.serviceSelect, 'servicio');
  }

  async selectFirstAvailableLeader() {
    return this.selectFirstNonEmptyOption(this.leaderSelect, 'lider');
  }

  async selectFirstAvailableEmployee() {
    const count = await this.employeeOptions.count();

    if (count === 0) {
      return null;
    }

    const firstEmployee = this.employeeOptions.first();
    const employeeName = (await firstEmployee.innerText()).trim();

    await firstEmployee.click();

    return employeeName;
  }

  async selectOptionByLabel(selectLocator, label, fieldName) {
    await expect
      .poll(async () => (
        selectLocator.locator('option').evaluateAll(
          (options, expectedLabel) => options.some((option) => option.textContent.trim() === expectedLabel),
          label
        )
      ))
      .toBeTruthy();

    await selectLocator.selectOption({ label });

    return label;
  }

  async selectEmployeeByName(employeeName) {
    const employeeOption = this.page.locator('form').getByText(employeeName, { exact: true });

    await expect(employeeOption).toBeVisible();
    await employeeOption.click();

    return employeeName;
  }

  async fillCreateForm(projectData) {
    await this.nameInput.fill(projectData.nombre);
    await this.descriptionInput.fill(projectData.descripcion);
    const service = await this.selectOptionByLabel(this.serviceSelect, 'Desarrollo Web', 'servicio');
    const leader = await this.selectOptionByLabel(this.leaderSelect, 'QA Lider', 'lider');
    const employee = await this.selectEmployeeByName('Primer QA Empleado');

    await this.budgetInput.fill(projectData.presupuesto);
    await this.marginInput.fill(projectData.margen);
    await this.startDateInput.fill(projectData.fecha_inicio);
    await this.endDateInput.fill(projectData.fecha_fin_estimada);

    return {
      service,
      leader,
      employee,
    };
  }

  async submitCreateFormAndCaptureProject() {
    const createResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/proyectos') && response.request().method() === 'POST'
    );

    await this.createProjectButton.click();
    const response = await createResponse;

    expect(response.status()).toBe(201);
    const responseBody = await response.json();

    expect(responseBody).toHaveProperty('success', true);
    expect(responseBody).toHaveProperty('data');
    expect(responseBody.data).toEqual(
      expect.objectContaining({
        id_proyecto: expect.any(Number),
        nombre: expect.any(String),
      })
    );

    await expect(this.createFormTitle).not.toBeVisible();

    return responseBody.data;
  }

  getProjectsFromApi(responseBody) {
    expect(responseBody.success).toBeTruthy();

    const projects = responseBody.data || [];

    expect(Array.isArray(projects)).toBeTruthy();
    expect(projects.length).toBeGreaterThan(0);

    return projects;
  }

  expectProjectFieldsAreValid(projects) {
    for (const project of projects) {
      expect(project).toEqual(
        expect.objectContaining({
          id_proyecto: expect.any(Number),
          nombre: expect.any(String),
        })
      );

      expect(project.nombre.trim()).not.toBe('');
    }
  }

  projectIdText(project) {
    return `#${project.id_proyecto}`;
  }

  projectIdRegex(project) {
    const projectIdText = this.projectIdText(project);
    return new RegExp(`(^|\\s)${escapeRegExp(projectIdText)}(\\s|$|\\.|·|,)`);
  }

  rowForProject(project) {
    return this.tableRows
      .filter({ hasText: project.nombre })
      .filter({ hasText: this.projectIdText(project) });
  }

  async expectProjectRowMatchesApi(project) {
    const row = this.rowForProject(project);

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(this.projectIdText(project));
    await expect(row.first()).toContainText(project.nombre);
  }

  async getVisibleProjectsFromApi(projects) {
    const visibility = await Promise.all(
      projects.map(async (project) => ({
        project,
        count: await this.rowForProject(project).count(),
      }))
    );

    return visibility
      .filter(({ count }) => count > 0)
      .map(({ project }) => project);
  }

  async expectProjectsFromApiVisible(projects) {
    const expectedVisibleRows = Math.min(projects.length, DEFAULT_PAGE_SIZE);

    await expect(this.tableRows).toHaveCount(expectedVisibleRows);
    await expect
      .poll(async () => (await this.getVisibleProjectsFromApi(projects)).length)
      .toBe(expectedVisibleRows);

    const visibleProjects = await this.getVisibleProjectsFromApi(projects);

    for (const project of visibleProjects) {
      await this.expectProjectRowMatchesApi(project);
    }
  }

  async searchFirstProjectFromApi(projects) {
    const visibleProjects = await this.getVisibleProjectsFromApi(projects);
    expect(visibleProjects.length).toBeGreaterThan(0);

    const [project] = visibleProjects;

    await this.searchInput.fill(project.nombre);

    const row = this.rowForProject(project);

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(`#${project.id_proyecto}`);
    await expect(row.first()).toContainText(project.nombre);
  }

  async searchProjectByName(name) {
    await this.searchInput.fill(name);
    await expect(this.tableRows.filter({ hasText: name })).toHaveCount(1);
  }

  async expectProjectFromApiVisibleByName(projects, name) {
    const project = projects.find((item) => item.nombre === name);

    expect(project, `No se encontro proyecto seed con nombre ${name}`).toBeTruthy();

    await this.searchProjectByName(name);
    await this.expectProjectRowMatchesApi(project);
  }

  async expectCreatedProjectVisible(project) {
    const row = this.rowForProject(project);

    await expect(row).toHaveCount(1);
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText(this.projectIdText(project));
    await expect(row.first()).toContainText(project.nombre);
  }

  async cleanupCreatedProjectByApi(projectId) {
    if (!projectId) return;

    const { backendUrl } = getQaEnv();
    const response = await this.page.request.put(`${backendUrl}/api/proyectos/${projectId}/desactivar`);

    expect([200, 400, 404]).toContain(response.status());
  }
}

module.exports = {
  ProyectosPage,
};
