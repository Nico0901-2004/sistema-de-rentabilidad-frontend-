const path = require('path');

const AUTH_ROLES = ['admin', 'propietario', 'lider', 'empleado'];
const authStateDir = path.resolve(__dirname, '..', '..', '.auth');

const storageStatePath = (role) => {
  if (!AUTH_ROLES.includes(role)) {
    throw new Error(`Rol QA no soportado para storageState: ${role}`);
  }

  return path.join(authStateDir, `${role}.json`);
};

module.exports = {
  AUTH_ROLES,
  authStateDir,
  storageStatePath,
};
