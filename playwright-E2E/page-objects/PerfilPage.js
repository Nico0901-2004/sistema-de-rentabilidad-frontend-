const { expect } = require('@playwright/test');

class PerfilPage {
  constructor(page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: 'Mi Perfil' });
    this.editButton = page.getByRole('button', { name: /Editar perfil/i });
    this.saveButton = page.getByRole('button', { name: /Guardar cambios/i });
    this.nameInput = page.locator('input[name="nombre"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.successAlert = page.getByText('Perfil actualizado correctamente.');
  }

  async goto() {
    await this.page.goto('/perfil');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/perfil\/?$/);
    await expect(this.title).toBeVisible();
  }

  async startEditing() {
    await this.editButton.click();
    await expect(this.nameInput).toBeVisible();
    await expect(this.nameInput).toBeEditable();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async getCurrentNameFromForm() {
    return this.nameInput.inputValue();
  }

  async updateName(name) {
    await this.nameInput.fill(name);
    await this.passwordInput.fill('');
    await this.saveButton.click();
  }

  async expectProfileUpdated(name) {
    await expect(this.successAlert).toBeVisible();
    await expect(this.page.getByText(name).first()).toBeVisible();
  }

  async reloadAndExpectName(name) {
    await this.page.reload();
    await this.expectLoaded();
    await expect(this.page.getByText(name).first()).toBeVisible();
  }
}

module.exports = {
  PerfilPage,
};
