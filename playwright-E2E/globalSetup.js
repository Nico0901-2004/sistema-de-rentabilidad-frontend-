const fs = require('fs/promises');
const path = require('path');

const { getQaEnv } = require('./helpers/env');
const { AUTH_ROLES, authStateDir, storageStatePath } = require('./helpers/authState');
const { resetLoginGuards } = require('./helpers/loginGuards');
const {
  BACKEND_ROOT,
  loadBackendQaEnv,
  getBackendQaPool,
  closeBackendQaPool,
} = require('./helpers/backendQaDb');

const BACKEND_JWT_PATH = path.join(BACKEND_ROOT, 'src', 'utils', 'jwt.js');
const BACKEND_COOKIE_PATH = path.join(BACKEND_ROOT, 'src', 'config', 'authCookie.js');

const getUserForRole = async (pool, role, email) => {
  const result = await pool.query(
    `SELECT id_usuario, email, rol, id_empresa
     FROM usuario
     WHERE LOWER(email) = LOWER($1)
       AND is_active = true
     LIMIT 1`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error(`No existe usuario QA activo para ${role}: ${email}`);
  }

  if (user.rol !== role) {
    throw new Error(`El usuario QA ${email} tiene rol ${user.rol}, se esperaba ${role}`);
  }

  return user;
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

module.exports = async () => {
  loadBackendQaEnv();
  await resetLoginGuards();
  await fs.mkdir(authStateDir, { recursive: true });

  const qaEnv = getQaEnv();
  const pool = getBackendQaPool();
  const { generateToken } = require(BACKEND_JWT_PATH);
  const { ACCESS_TOKEN_COOKIE } = require(BACKEND_COOKIE_PATH);

  try {
    for (const role of AUTH_ROLES) {
      const user = await getUserForRole(pool, role, qaEnv.users[role]);
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

      await fs.writeFile(
        storageStatePath(role),
        `${JSON.stringify(storageState, null, 2)}\n`,
        'utf8'
      );
    }
  } finally {
    await closeBackendQaPool();
  }
};
