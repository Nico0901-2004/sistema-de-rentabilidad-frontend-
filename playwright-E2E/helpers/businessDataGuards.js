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
       AND nombre LIKE 'CP-HU18-E2E-%'`,
    [Number(projectId)]
  );
};

const cleanupCreatedCompany = async ({ companyId, companyName } = {}) => {
  if (!companyId && !companyName) return;

  const pool = getBackendQaPool();
  await pool.query(
    `DELETE FROM empresa
     WHERE ($1::integer IS NULL OR id_empresa = $1)
       AND ($2::text IS NULL OR nombre = $2)
       AND nombre LIKE 'CP HU Cuatro Empresa %'`,
    [companyId ? Number(companyId) : null, companyName || null]
  );
};

const deactivateCreatedNote = async (noteId) => {
  if (!noteId) return;

  const pool = getBackendQaPool();
  await pool.query(
    `UPDATE nota
     SET is_active = false
     WHERE id_nota = $1
       AND descripcion LIKE 'CP-HU26-E2E-%'`,
    [Number(noteId)]
  );
};

const deactivateCreatedService = async (serviceId) => {
  if (!serviceId) return;

  const pool = getBackendQaPool();
  await pool.query(
    `UPDATE servicio
     SET is_active = false
     WHERE id_servicio = $1
       AND nombre LIKE 'CP HU Ocho Servicio %'`,
    [Number(serviceId)]
  );
};

const cleanupCreatedEmployee = async ({ userId, email } = {}) => {
  if (!userId && !email) return;

  const pool = getBackendQaPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `SELECT id_usuario
       FROM usuario
       WHERE ($1::integer IS NULL OR id_usuario = $1)
         AND ($2::text IS NULL OR LOWER(email) = LOWER($2))
         AND email LIKE 'cp_hu13_e2e_%@test.com'
       LIMIT 1`,
      [userId ? Number(userId) : null, email || null]
    );
    const targetUserId = userResult.rows[0]?.id_usuario;

    if (targetUserId) {
      await client.query('DELETE FROM historial_sueldo WHERE id_usuario = $1', [targetUserId]);
      await client.query('DELETE FROM usuario WHERE id_usuario = $1', [targetUserId]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getQaTechCompanyId = async (client) => {
  const result = await client.query(
    `SELECT id_empresa
     FROM empresa
     WHERE nombre = 'QA Tech SAC'
     LIMIT 1`
  );

  const companyId = result.rows[0]?.id_empresa;

  if (!companyId) {
    throw new Error('No se encontro la empresa seed QA Tech SAC');
  }

  return companyId;
};

const getProjectByName = async (projectName = 'Proyecto Delta') => {
  const pool = getBackendQaPool();
  const result = await pool.query(
    `SELECT id_proyecto, nombre, id_empresa
     FROM proyecto
     WHERE nombre = $1
       AND is_active = true
     LIMIT 1`,
    [projectName]
  );

  const project = result.rows[0];

  if (!project) {
    throw new Error(`No se encontro proyecto seed activo: ${projectName}`);
  }

  return project;
};

const getQaUserByEmail = async (email) => {
  const pool = getBackendQaPool();
  const result = await pool.query(
    `SELECT id_usuario, nombre, email, rol, id_empresa
     FROM usuario
     WHERE LOWER(email) = LOWER($1)
       AND is_active = true
     LIMIT 1`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error(`No se encontro usuario QA activo: ${email}`);
  }

  return user;
};

const createPhaseForProject = async ({ projectName = 'Proyecto Delta', nombre, horas_estimadas = 8 }) => {
  const pool = getBackendQaPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const projectResult = await client.query(
      `SELECT id_proyecto
       FROM proyecto
       WHERE nombre = $1
         AND is_active = true
       LIMIT 1`,
      [projectName]
    );

    const projectId = projectResult.rows[0]?.id_proyecto;

    if (!projectId) {
      throw new Error(`No se encontro proyecto seed activo: ${projectName}`);
    }

    const phaseResult = await client.query(
      `INSERT INTO fase (id_proyecto, nombre, horas_estimadas, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id_fase, id_proyecto, nombre, horas_estimadas`,
      [projectId, nombre, Number(horas_estimadas)]
    );

    await client.query('COMMIT');

    return phaseResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deactivateCreatedPhase = async (phaseId) => {
  if (!phaseId) return;

  const pool = getBackendQaPool();
  await pool.query(
    `UPDATE fase
     SET is_active = false
     WHERE id_fase = $1
       AND nombre LIKE 'Fase QA %'`,
    [Number(phaseId)]
  );
};

const deleteHourRecordsByDescription = async ({ employeeId, descripcion }) => {
  if (!employeeId && !descripcion) return;

  const pool = getBackendQaPool();
  await pool.query(
    `DELETE FROM registro_horas
     WHERE ($1::integer IS NULL OR id_empleado = $1)
       AND ($2::text IS NULL OR descripcion = $2)
       AND (descripcion LIKE 'Horas QA %' OR descripcion LIKE 'Marcaje salida %')`,
    [employeeId ? Number(employeeId) : null, descripcion || null]
  );
};

const createHourRecordForUser = async ({ employeeEmail, projectName = 'Proyecto Delta', phaseId, horas = 0.5, descripcion }) => {
  const pool = getBackendQaPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `SELECT id_usuario
       FROM usuario
       WHERE LOWER(email) = LOWER($1)
         AND is_active = true
       LIMIT 1`,
      [employeeEmail]
    );

    const employeeId = userResult.rows[0]?.id_usuario;

    if (!employeeId) {
      throw new Error(`No se encontro empleado QA activo: ${employeeEmail}`);
    }

    const projectResult = await client.query(
      `SELECT id_proyecto
       FROM proyecto
       WHERE nombre = $1
         AND is_active = true
       LIMIT 1`,
      [projectName]
    );

    const projectId = projectResult.rows[0]?.id_proyecto;

    if (!projectId) {
      throw new Error(`No se encontro proyecto seed activo: ${projectName}`);
    }

    const recordResult = await client.query(
      `INSERT INTO registro_horas (id_empleado, id_proyecto, id_fase, fecha, horas, descripcion)
       VALUES ($1, $2, $3, timezone('America/Lima', now())::date, $4, $5)
       RETURNING id_registro, id_empleado, id_proyecto, id_fase, fecha::text, horas, descripcion`,
      [employeeId, projectId, Number(phaseId), Number(horas), descripcion]
    );

    await client.query('COMMIT');

    return recordResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const createMonthlyEmployeeForMarcaje = async ({ nombre, email, projectName = 'Proyecto Delta' }) => {
  const pool = getBackendQaPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const companyId = await getQaTechCompanyId(client);
    const userResult = await client.query(
      `INSERT INTO usuario (nombre, email, password, rol, id_empresa, is_active)
       VALUES ($1, $2, $3, 'empleado', $4, true)
       RETURNING id_usuario, nombre, email, rol, id_empresa`,
      [nombre, email, 'E2E_TEMPORARY_PASSWORD_NOT_FOR_LOGIN', companyId]
    );

    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO historial_sueldo (id_usuario, tipo_pago, monto, fecha_inicio, fecha_fin, horas_mensuales)
       VALUES ($1, 'mensual', 3200, timezone('America/Lima', now())::date, NULL, 160)`,
      [user.id_usuario]
    );

    const projectResult = await client.query(
      `SELECT id_proyecto
       FROM proyecto
       WHERE nombre = $1
         AND id_empresa = $2
         AND is_active = true
       LIMIT 1`,
      [projectName, companyId]
    );

    const projectId = projectResult.rows[0]?.id_proyecto;

    if (!projectId) {
      throw new Error(`No se encontro proyecto activo ${projectName} para QA Tech SAC`);
    }

    await client.query(
      `INSERT INTO proyecto_empleado (id_proyecto, id_empleado)
       VALUES ($1, $2)
       ON CONFLICT (id_proyecto, id_empleado) DO NOTHING`,
      [projectId, user.id_usuario]
    );

    await client.query('COMMIT');

    return {
      ...user,
      projectId,
      tipo_pago: 'mensual',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const resetTodayMarcajeForUser = async (userId) => {
  if (!userId) return;

  const pool = getBackendQaPool();
  await pool.query(
    `DELETE FROM marcaje
     WHERE id_usuario = $1
       AND fecha = timezone('America/Lima', now())::date`,
    [Number(userId)]
  );
};

const seedOpenMarcajeForToday = async (userId) => {
  await resetTodayMarcajeForUser(userId);

  const pool = getBackendQaPool();
  const result = await pool.query(
    `INSERT INTO marcaje (id_usuario, fecha, hora_entrada, hora_salida)
     VALUES (
       $1,
       timezone('America/Lima', now())::date,
       timezone('America/Lima', now()) - interval '2 hours',
       NULL
     )
     RETURNING id_marcaje, id_usuario, fecha::text, hora_entrada, hora_salida`,
    [Number(userId)]
  );

  return result.rows[0];
};

const seedCompletedMarcajeForToday = async (userId) => {
  await resetTodayMarcajeForUser(userId);

  const pool = getBackendQaPool();
  const result = await pool.query(
    `INSERT INTO marcaje (id_usuario, fecha, hora_entrada, hora_salida)
     VALUES (
       $1,
       timezone('America/Lima', now())::date,
       timezone('America/Lima', now()) - interval '3 hours',
       timezone('America/Lima', now()) - interval '1 hour'
     )
     RETURNING id_marcaje, id_usuario, fecha::text, hora_entrada, hora_salida`,
    [Number(userId)]
  );

  return result.rows[0];
};

const cleanupMarcajeEmployee = async ({ userId, email } = {}) => {
  if (!userId && !email) return;

  const pool = getBackendQaPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `SELECT id_usuario
       FROM usuario
       WHERE ($1::integer IS NULL OR id_usuario = $1)
         AND ($2::text IS NULL OR LOWER(email) = LOWER($2))
         AND email LIKE 'qa_marcaje_empleado_%@test.com'
       LIMIT 1`,
      [userId ? Number(userId) : null, email || null]
    );

    const targetUserId = userResult.rows[0]?.id_usuario;

    if (targetUserId) {
      await client.query('DELETE FROM registro_horas WHERE id_empleado = $1', [targetUserId]);
      await client.query('DELETE FROM marcaje WHERE id_usuario = $1', [targetUserId]);
      await client.query('DELETE FROM fase_empleado WHERE id_empleado = $1', [targetUserId]);
      await client.query('DELETE FROM proyecto_empleado WHERE id_empleado = $1', [targetUserId]);
      await client.query('DELETE FROM historial_sueldo WHERE id_usuario = $1', [targetUserId]);
      await client.query('DELETE FROM usuario WHERE id_usuario = $1', [targetUserId]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
  cleanupCreatedCompany,
  cleanupCreatedEmployee,
  cleanupCreatedOwnerAndCompany,
  cleanupMarcajeEmployee,
  createHourRecordForUser,
  createMonthlyEmployeeForMarcaje,
  createPhaseForProject,
  deactivateCreatedProject,
  deactivateCreatedNote,
  deactivateCreatedService,
  deactivateCreatedPhase,
  deleteHourRecordsByDescription,
  getProjectByName,
  getQaUserByEmail,
  resetQaUserProfile,
  resetTodayMarcajeForUser,
  seedCompletedMarcajeForToday,
  seedOpenMarcajeForToday,
};
