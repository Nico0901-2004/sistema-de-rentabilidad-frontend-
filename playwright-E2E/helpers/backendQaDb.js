const path = require('path');
const dotenv = require('dotenv');

const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..', 'Sistema-de-Rentabilidad-Backend-');
const BACKEND_ENV_PATH = path.join(BACKEND_ROOT, '.env.qa');
const BACKEND_DB_PATH = path.join(BACKEND_ROOT, 'src', 'config', 'db.js');

let pool = null;

const loadBackendQaEnv = () => {
  dotenv.config({ path: BACKEND_ENV_PATH, quiet: true });
};

const getBackendQaPool = () => {
  loadBackendQaEnv();

  if (!pool) {
    pool = require(BACKEND_DB_PATH);
  }

  return pool;
};

const closeBackendQaPool = async () => {
  if (!pool) return;

  await pool.end();
  pool = null;
  delete require.cache[require.resolve(BACKEND_DB_PATH)];
};

module.exports = {
  BACKEND_ROOT,
  loadBackendQaEnv,
  getBackendQaPool,
  closeBackendQaPool,
};
