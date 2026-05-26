const { expect } = require('@playwright/test');
const { getQaEnv } = require('./env');

const HOME_BY_ROLE = {
  admin: '/admin-dashboard',
  propietario: '/dashboard',
  lider: '/panel-lider',
  empleado: '/mi-espacio',
};

const loginAs = async (page, role = 'propietario') => {
  const qaEnv = getQaEnv();
  const email = qaEnv.users[role];
  const homePath = HOME_BY_ROLE[role];

  if (!email || !homePath) {
    throw new Error(`Rol QA no soportado: ${role}`);
  }

  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(qaEnv.password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${homePath}/?$`));
};

module.exports = {
  loginAs,
};
