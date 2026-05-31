const { expect } = require('@playwright/test');

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
    const tableBodyText = await this.tableBody.innerText();
    const idPattern = /(^|\s)(#\d+)(\s|$|\.|·|,)/g;
    const visibleIds = new Set();

    let match;
    while ((match = idPattern.exec(tableBodyText)) !== null) {
      visibleIds.add(match[2]);
    }

    return projects.filter((project) => visibleIds.has(`#${project.id_proyecto}`));
  }

  async expectProjectsFromApiVisible(projects) {
    const expectedVisibleRows = Math.min(projects.length, DEFAULT_PAGE_SIZE);

    await expect(this.tableRows).toHaveCount(expectedVisibleRows);

    const visibleProjects = await this.getVisibleProjectsFromApi(projects);

    expect(visibleProjects.length).toBe(expectedVisibleRows);

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
}

module.exports = {
  ProyectosPage,
};