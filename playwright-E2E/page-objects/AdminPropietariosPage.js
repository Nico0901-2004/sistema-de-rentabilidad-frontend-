const { expect } = require('@playwright/test');

const DEFAULT_PAGE_SIZE = 6;

class AdminPropietariosPage {
  constructor(page) {
    this.page = page;
    this.moduleLink = page.locator('nav a[href="/propietarios"]');
    this.searchInput = page.getByPlaceholder('Buscar por nombre, email o empresa...');
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    this.totalOwnersLabel = page.getByText('Total propietarios');
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
}

module.exports = {
  AdminPropietariosPage,
};
