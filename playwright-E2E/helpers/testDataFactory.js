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

module.exports = {
  getProfileEditName,
  getProjectRegistrationData,
};
