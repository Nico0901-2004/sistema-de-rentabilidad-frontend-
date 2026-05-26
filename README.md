# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Entorno QA y pruebas E2E con Playwright

El frontend queda preparado para ejecutar pruebas E2E con Playwright contra el backend Express en entorno QA.

### Configuracion

- Usa `.env.qa` en el frontend.
- El backend debe ejecutarse con su propio `.env.qa`.
- `REACT_APP_API_URL` debe apuntar al backend QA.
- `FRONTEND_URL` del backend debe coincidir con `QA_FRONTEND_URL` para evitar bloqueos CORS.
- Los tests E2E deben crearse dentro de `playwright-E2E/`.

### Variables requeridas en `.env.qa`

```env
PORT=3001
QA_ENV=qa
REACT_APP_ENV=qa
REACT_APP_API_URL=http://localhost:3000/api

QA_FRONTEND_URL=http://localhost:3001
QA_BACKEND_URL=http://localhost:3000

QA_ADMIN_EMAIL=qa_admin@test.com
QA_PROPIETARIO_EMAIL=qa_propietario@test.com
QA_LIDER_EMAIL=qa_lider@test.com
QA_EMPLEADO_EMAIL=qa_empleado1@test.com
QA_USER_PASSWORD=Qa123456*
```

> No subir `.env.qa` al repositorio. Este archivo esta ignorado por Git.

### Instalacion inicial

```bash
npm install
npx playwright install
```

### Levantar frontend QA

```bash
npm run start:qa
```

Al iniciar, el frontend muestra el entorno cargado:

```txt
Node.js vXX.XX.X
Frontend running on port 3001
Environment: qa
```

### Sembrar datos QA desde backend

```bash
npm run qa:seed
```

Este comando usa los seeders existentes del backend y carga usuarios, empresas, servicios, proyectos, fases, horas y marcajes para pruebas.

> Ejecutar seeds QA solo contra una base de datos QA.

### Ejecutar pruebas E2E

```bash
npm run test:e2e
```

### Ejecutar pruebas E2E reiniciando datos QA antes

```bash
npm run test:e2e:qa
```

### Abrir Playwright en modo UI

```bash
npm run test:e2e:ui
```

### Ejecutar Playwright con navegador visible

```bash
npm run test:e2e:headed
```

### Scripts E2E disponibles

```json
{
  "start:qa": "node start-qa.js",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "qa:seed": "npm --prefix ../Sistema-de-Rentabilidad-Backend- run seed:qa",
  "test:e2e:qa": "npm run qa:seed && playwright test"
}
```

### Datos QA precargados

Los helpers E2E estan preparados para usar los usuarios creados por los seeders del backend:

| Rol | Email |
|---|---|
| Admin | `qa_admin@test.com` |
| Propietario | `qa_propietario@test.com` |
| Lider | `qa_lider@test.com` |
| Empleado | `qa_empleado1@test.com` |
| Empleado | `qa_empleado2@test.com` |

La contrasena se lee desde `QA_USER_PASSWORD`.

## Pruebas unitarias y de componentes con Vitest + React Testing Library

El frontend queda preparado para ejecutar pruebas unitarias, pruebas de componentes React e integracion ligera con Vitest + React Testing Library.

Estas pruebas no levantan navegador real ni backend real. Para flujos reales de usuario, autenticacion contra backend, navegacion completa y pruebas por rol se debe seguir usando Playwright dentro de `playwright-E2E/`.

### Configuracion

- Vitest se configura desde `vitest.config.js`.
- El entorno de pruebas usa `jsdom` para simular el DOM en Node.js.
- React Testing Library se inicializa desde `tests/setup/setupTests.js`.
- Las pruebas futuras deben crearse dentro de `tests/`.
- Las pruebas E2E deben mantenerse dentro de `playwright-E2E/`.
- El script `npm test` se mantiene con `react-scripts test` para no romper la configuracion original de Create React App.

### Estructura de pruebas

```txt
tests/
├── unit/
├── components/
├── integration/
└── setup/
    └── setupTests.js
```

- `tests/unit/`: pruebas de funciones, utilidades, validaciones, services mockeados y logica aislada.
- `tests/components/`: pruebas de componentes React con React Testing Library.
- `tests/integration/`: pruebas ligeras entre componentes, hooks o services mockeados.
- `tests/setup/`: configuracion global usada por Vitest.
- `tests/setup/setupTests.js`: carga `@testing-library/jest-dom/vitest`, limpia el DOM, mocks y storage despues de cada prueba.

### Ejecutar Vitest en modo watch

```bash
npm run test:vitest
```

Tambien se puede usar:

```bash
npm run test:watch
```

### Ejecutar pruebas unitarias y de componentes una sola vez

```bash
npm run test:unit
```

Este comando ejecuta Vitest en modo `run`, pensado para validaciones puntuales o integracion continua.

### Ejecutar cobertura

```bash
npm run test:coverage
```

La cobertura se genera con el provider `v8` y se guarda en `coverage/`.

### Scripts Vitest disponibles

```json
{
  "test:vitest": "vitest",
  "test:unit": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

### Uso de `.env.qa` en Vitest

`vitest.config.js` puede leer `.env.qa`, pero solo carga variables frontend no sensibles:

- `REACT_APP_ENV`
- `REACT_APP_API_URL`

Las credenciales y URLs propias de E2E deben reservarse para Playwright:

- `QA_FRONTEND_URL`
- `QA_BACKEND_URL`
- `QA_ADMIN_EMAIL`
- `QA_PROPIETARIO_EMAIL`
- `QA_LIDER_EMAIL`
- `QA_EMPLEADO_EMAIL`
- `QA_USER_PASSWORD`

No hardcodear credenciales en pruebas unitarias o de componentes. Si una prueba necesita backend real o usuarios QA reales, debe implementarse como prueba E2E con Playwright.

### Diferencia entre Vitest y Playwright

| Herramienta | Carpeta | Uso principal | Backend real |
|---|---|---|---|
| Vitest + React Testing Library | `tests/` | Unitarias, componentes e integracion ligera con mocks | No |
| Playwright | `playwright-E2E/` | Flujos reales en navegador, login real, roles y navegacion completa | Si |

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
