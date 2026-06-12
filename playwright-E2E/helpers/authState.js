const path = require('path');
const fs = require('fs/promises');

const { getQaEnv } = require('./env');
const { BACKEND_ROOT, loadBackendQaEnv } = require('./backendQaDb');

const AUTH_ROLES = ['admin', 'propietario', 'lider', 'empleado'];
const authStateDir = path.resolve(__dirname, '..', '..', '.auth');
const BACKEND_JWT_PATH = path.join(BACKEND_ROOT, 'src', 'utils', 'jwt.js');
const BACKEND_COOKIE_PATH = path.join(BACKEND_ROOT, 'src', 'config', 'authCookie.js');

const storageStatePath = (role) => {
  if (!AUTH_ROLES.includes(role)) {
    throw new Error(`Rol QA no soportado para storageState: ${role}`);
  }

  return path.join(authStateDir, `${role}.json`);
};

const createStorageState = ({ backendUrl, cookieName, token }) => {
  const url = new URL(backendUrl);

  return {
    cookies: [
      {
        name: cookieName,
        value: token,
        domain: url.hostname,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        httpOnly: true,
        secure: url.protocol === 'https:',
        sameSite: url.protocol === 'https:' && process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      },
    ],
    origins: [],
  };
};

const storageStateForUser = async (user, testInfo) => {
  if (!user?.id_usuario || !user?.email || !user?.rol) {
    throw new Error('Usuario invalido para generar storageState E2E');
  }

  loadBackendQaEnv();
  await fs.mkdir(authStateDir, { recursive: true });

  const qaEnv = getQaEnv();
  const { generateToken } = require(BACKEND_JWT_PATH);
  const { ACCESS_TOKEN_COOKIE } = require(BACKEND_COOKIE_PATH);

  const token = generateToken({
    id_usuario: user.id_usuario,
    email: user.email,
    rol: user.rol,
    id_empresa: user.id_empresa,
  });

  const storageState = createStorageState({
    backendUrl: qaEnv.backendUrl,
    cookieName: ACCESS_TOKEN_COOKIE,
    token,
  });

  const safeEmail = user.email.replace(/[^a-zA-Z0-9_-]/g, '_');
  const workerIndex = testInfo?.workerIndex ?? 'w0';
  const retry = testInfo?.retry ?? 0;
  const filePath = path.join(authStateDir, `e2e-${safeEmail}-${workerIndex}-${retry}.json`);

  await fs.writeFile(filePath, `${JSON.stringify(storageState, null, 2)}\n`, 'utf8');

  return filePath;
};

module.exports = {
  AUTH_ROLES,
  authStateDir,
  createStorageState,
  storageStatePath,
  storageStateForUser,
};
