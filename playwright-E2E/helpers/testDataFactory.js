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
    nombre: `CP-HU18-E2E-${suffix}`,
    descripcion: 'Proyecto automatizado de prueba',
    presupuesto: '15000',
    margen: '20',
    fecha_inicio: toIsoDate(startDate),
    fecha_fin_estimada: toIsoDate(endDate),
  };
};

const getCompanyRegistrationData = (testInfo) => ({
  nombre: `CP HU Cuatro Empresa ${getLettersOnlySuffix(testInfo)}`,
});

const getNoteRegistrationData = (testInfo) => ({
  proyecto: 'Proyecto Delta',
  descripcion: `CP-HU26-E2E-${getUniqueSuffix(testInfo)}`,
});

const getServiceRegistrationData = (testInfo) => ({
  nombre: `CP HU Ocho Servicio ${getLettersOnlySuffix(testInfo)}`,
  descripcion: `Servicio automatizado ${getLettersOnlySuffix(testInfo)}`,
});

const getEmployeeRegistrationData = (testInfo) => {
  const suffix = getUniqueSuffix(testInfo).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return {
    nombre: `CP HU Trece Empleado ${getLettersOnlySuffix(testInfo)}`,
    email: `cp_hu13_e2e_${suffix}@test.com`,
    password: 'Password123*',
    rol: 'empleado',
    monto: '3200',
    tipo_pago: 'mensual',
    horas_mensuales: '160',
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

const getPhaseData = (testInfo, prefix = 'Fase QA') => {
  const suffix = getLettersOnlySuffix(testInfo);

  return {
    nombre: `${prefix} ${suffix}`,
    horas_estimadas: '12.5',
  };
};

const getHourRegistrationData = (testInfo, prefix = 'Horas QA') => {
  const suffix = getUniqueSuffix(testInfo).replace(/[^a-zA-Z0-9]/g, '').slice(-12);

  return {
    horas: '0.5',
    descripcion: `${prefix} ${suffix}`,
  };
};

const getMarcajeEmployeeData = (testInfo) => {
  const suffix = getUniqueSuffix(testInfo).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return {
    nombre: `Empleado Marcaje ${getLettersOnlySuffix(testInfo)}`,
    email: `qa_marcaje_empleado_${suffix}@test.com`,
  };
};

module.exports = {
  getUniqueSuffix,
  getLettersOnlySuffix,
  getProfileEditName,
  getProjectRegistrationData,
  getCompanyRegistrationData,
  getNoteRegistrationData,
  getServiceRegistrationData,
  getEmployeeRegistrationData,
  getOwnerRegistrationData,
  getTemporaryCompanyData,
  getPhaseData,
  getHourRegistrationData,
  getMarcajeEmployeeData,
};
