const { getQaEnv } = require('./env');
const { getBackendQaPool } = require('./backendQaDb');

const QA_USER_BASELINES = {
  empleado: {
    emailKey: 'empleado',
    nombre: 'Primer QA Empleado',
  },
};

const cleanupCreatedOwnerAndCompany = async ({ ownerEmail, companyId, companyName } = {}) => {
  const pool = getBackendQaPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (ownerEmail) {
      await client.query(
        `DELETE FROM usuario
         WHERE LOWER(email) = LOWER($1)
           AND email LIKE 'qa_propietario_%@test.com'`,
        [ownerEmail]
      );
    }

    if (companyId || companyName) {
      await client.query(
        `DELETE FROM empresa
         WHERE ($1::integer IS NULL OR id_empresa = $1)
           AND ($2::text IS NULL OR nombre = $2)
           AND nombre LIKE 'Empresa Temporal %'`,
        [companyId ? Number(companyId) : null, companyName || null]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deactivateCreatedProject = async (projectId) => {
  if (!projectId) return;

  const pool = getBackendQaPool();
  await pool.query(
    `UPDATE proyecto
     SET is_active = false
     WHERE id_proyecto = $1
       AND nombre LIKE 'Proyecto QA Registro %'`,
    [Number(projectId)]
  );
};

const resetQaUserProfile = async (role = 'empleado') => {
  const baseline = QA_USER_BASELINES[role];

  if (!baseline) {
    throw new Error(`No hay baseline QA configurado para perfil de rol: ${role}`);
  }

  const qaEnv = getQaEnv();
  const email = qaEnv.users[baseline.emailKey];
  const pool = getBackendQaPool();

  await pool.query(
    `UPDATE usuario
     SET nombre = $1
     WHERE LOWER(email) = LOWER($2)`,
    [baseline.nombre, email]
  );
};

module.exports = {
  cleanupCreatedOwnerAndCompany,
  deactivateCreatedProject,
  resetQaUserProfile,
};
