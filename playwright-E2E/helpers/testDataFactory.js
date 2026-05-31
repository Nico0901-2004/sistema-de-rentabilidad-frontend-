const PROFILE_TEST_NAMES = [
  'Perfil Prueba Alfa',
  'Perfil Prueba Beta',
];

const getProfileEditName = (currentName = '') => {
  const normalizedCurrentName = currentName.trim().toLowerCase();

  return PROFILE_TEST_NAMES.find(
    (name) => name.toLowerCase() !== normalizedCurrentName
  ) || PROFILE_TEST_NAMES[0];
};

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const numberToLetters = (value) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let number = Number(value);
  let result = '';

  do {
    result = letters[number % letters.length] + result;
    number = Math.floor(number / letters.length);
  } while (number > 0);

  return result;
};

const getProjectRegistrationData = () => {
  const timestamp = Date.now();
  const startDate = new Date();

  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  return {
    nombre: `Proyecto QA Registro ${timestamp}`,
    descripcion: 'Proyecto automatizado de prueba',
    presupuesto: '15000',
    margen: '20',
    fecha_inicio: toIsoDate(startDate),
    fecha_fin_estimada: toIsoDate(endDate),
  };
};

const getOwnerRegistrationData = () => {
  const timestamp = Date.now();
  const suffix = numberToLetters(timestamp);

  return {
    nombre: `Propietario Prueba ${suffix}`,
    email: `qa_propietario_${timestamp}@test.com`,
    password: 'Password123*',
  };
};

const getTemporaryCompanyData = () => {
  const suffix = numberToLetters(Date.now());

  return {
    nombre: `Empresa Temporal ${suffix}`,
  };
};

module.exports = {
  getProfileEditName,
  getProjectRegistrationData,
  getOwnerRegistrationData,
  getTemporaryCompanyData,
};
