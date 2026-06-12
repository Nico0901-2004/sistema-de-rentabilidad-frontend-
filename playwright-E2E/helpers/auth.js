const { SesionPage } = require('../page-objects/SesionPage');

const loginAs = async (page, role = 'propietario') => {
  const sesionPage = new SesionPage(page);

  await sesionPage.loginAs(role);
};

module.exports = {
  loginAs,
};
