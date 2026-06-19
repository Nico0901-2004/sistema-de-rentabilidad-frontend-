import api from "./api";

export const getHoras = async () => {
  const response = await api.get("/horas");
  return response.data;
};

export const getMisHoras = getHoras;

export const createHora = async (data) => {
  const response = await api.post("/horas", data);
  return response.data;
};

export const updateHora = async (id, data) => {
  const response = await api.put(`/horas/${id}`, data);
  return response.data;
};

export const marcarEntrada = async () => {
  const response = await api.post("/marcajes/entrada");
  return response.data;
};

export const marcarSalida = async () => {
  const response = await api.post("/marcajes/salida");
  return response.data;
};


export const getMisMarcajes = async () => {
  const response = await api.get("/marcajes");
  return response.data;
};

// Añadir esta nueva función para el Propietario y el Líder
export const getMarcajesEmpresa = async () => {
  const response = await api.get("/marcajes/empresa");
  return response.data;
};

export const getHorasEmpresa = async () => {
  const response = await api.get("/horas/empresa");
  return response.data;
};
