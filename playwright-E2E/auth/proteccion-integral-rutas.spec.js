const { test } = require('../fixtures/e2eTest');
const { SesionPage } = require('../page-objects/SesionPage');

const PRIVATE_ROUTES = [
  '/admin-dashboard', '/empresas', '/propietarios', '/dashboard', '/empresa-config', '/usuarios', '/servicios',
  '/rentabilidad', '/panel-lider', '/notas', '/mi-espacio', '/mis-horas', '/mis-marcajes', '/proyectos', '/perfil',
  '/proyectos/1/fases', '/proyectos/1/notas',
];

test.describe.serial('CP-HU1-9-E2E - Proteccion integral de rutas', () => {
  test('impide acceder manualmente a modulos privados sin sesion', async ({ page }) => {
    const sesionPage = new SesionPage(page);

    for (const privateRoute of PRIVATE_ROUTES) {
      await test.step(`protege ${privateRoute}`, async () => {
        await sesionPage.expectPrivateRouteBlockedForAnonymousUser(privateRoute);
      });
    }
  });
});
