const { getQaEnv } = require('./env');
const { AUTH_ROLES } = require('./authState');
const { getBackendQaPool, closeBackendQaPool } = require('./backendQaDb');

const getEmailsForRoles = (roles = AUTH_ROLES) => {
  const qaEnv = getQaEnv();
  const selectedRoles = roles.length > 0 ? roles : AUTH_ROLES;

  return [...new Set(selectedRoles.map((role) => {
    const email = qaEnv.users[role];

    if (!email) {
      throw new Error(`Rol QA no soportado para reset de login: ${role}`);
    }

    return email.trim().toLowerCase();
  }))];
};

const resetLoginGuards = async ({ roles = AUTH_ROLES } = {}) => {
  const emails = getEmailsForRoles(roles);
  const pool = getBackendQaPool();

  await pool.query(
    `UPDATE usuario
     SET failed_login_attempts = 0,
         locked_until = NULL,
         last_failed_login_at = NULL
     WHERE LOWER(email) = ANY($1::text[])`,
    [emails]
  );

  await pool.query(
    `DELETE FROM private.login_rate_limits
     WHERE key LIKE 'login:%'`
  );
};

module.exports = {
  resetLoginGuards,
  closeLoginGuardResetConnection: closeBackendQaPool,
};
