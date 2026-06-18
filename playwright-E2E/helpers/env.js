const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.qa'), quiet: true });

const REQUIRED_ENV_VARS = [
  'QA_FRONTEND_URL',
  'QA_BACKEND_URL',
  'QA_ADMIN_EMAIL',
  'QA_PROPIETARIO_EMAIL',
  'QA_LIDER_EMAIL',
  'QA_EMPLEADO_EMAIL',
  'QA_USER_PASSWORD',
];

const getQaEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno QA: ${missing.join(', ')}`);
  }

  return {
    frontendUrl: process.env.QA_FRONTEND_URL,
    backendUrl: process.env.QA_BACKEND_URL,
    users: {
      admin: process.env.QA_ADMIN_EMAIL,
      propietario: process.env.QA_PROPIETARIO_EMAIL,
      lider: process.env.QA_LIDER_EMAIL,
      empleado: process.env.QA_EMPLEADO_EMAIL,
    },
    password: process.env.QA_USER_PASSWORD,
  };
};

module.exports = {
  getQaEnv,
};
