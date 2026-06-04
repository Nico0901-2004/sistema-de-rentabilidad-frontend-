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

const getUniqueSuffix = (testInfo) => {
  const workerIndex = testInfo?.workerIndex ?? 'w0';
  const retry = testInfo?.retry ?? 0;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 7);

  return `${workerIndex}-${retry}-${timestamp}-${random}`;
};

const numberToLetters = (value) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let number = Math.abs(Number(value)) || 0;
  let result = '';

  do {
    result = letters[number % letters.length] + result;
    number = Math.floor(number / letters.length);
  } while (number > 0);

  return result;
};

const getLettersOnlySuffix = (testInfo) => {
  const workerIndex = testInfo?.workerIndex ?? 0;
  const retry = testInfo?.retry ?? 0;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);

  return [
    numberToLetters(workerIndex),
    numberToLetters(retry),
    numberToLetters(timestamp),
    numberToLetters(random),
  ].join(' ');
};

const getProjectRegistrationData = (testInfo) => {
  const suffix = getUniqueSuffix(testInfo);
  const startDate = new Date();

  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  return {
    nombre: `Proyecto QA Registro #${suffix} / E2E`,
    descripcion: 'Proyecto automatizado de prueba',
    presupuesto: '15000',
    margen: '20',
    fecha_inicio: toIsoDate(startDate),
    fecha_fin_estimada: toIsoDate(endDate),
  };
};

const getOwnerRegistrationData = (testInfo) => {
  const suffix = getUniqueSuffix(testInfo);
  const nameSuffix = getLettersOnlySuffix(testInfo);
  const emailSuffix = suffix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return {
    nombre: `Propietario Prueba ${nameSuffix}`,
    email: `qa_propietario_${emailSuffix}@test.com`,
    password: 'Password123*',
  };
};

const getTemporaryCompanyData = (testInfo) => {
  const suffix = getLettersOnlySuffix(testInfo);

  return {
    nombre: `Empresa Temporal ${suffix}`,
  };
};

module.exports = {
  getUniqueSuffix,
  getLettersOnlySuffix,
  getProfileEditName,
  getProjectRegistrationData,
  getOwnerRegistrationData,
  getTemporaryCompanyData,
};
