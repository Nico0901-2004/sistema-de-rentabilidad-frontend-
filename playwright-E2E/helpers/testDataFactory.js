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

module.exports = {
  getProfileEditName,
};
