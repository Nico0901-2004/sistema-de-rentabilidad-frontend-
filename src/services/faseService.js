import api from "./api";

export const getFasesByProyecto = async (proyectoId) => {
  const response = await api.get(`/proyectos/${proyectoId}/fases`);
  return response.data;
};

export const getFaseById = async (id) => {
  const response = await api.get(`/fases/${id}`);
  return response.data;
};

export const createFase = async (proyectoId, data) => {
  const response = await api.post(`/proyectos/${proyectoId}/fases`, data);
  return response.data;
};

export const updateFase = async (id, data) => {
  try {
    const response = await api.put(`/fases/${id}`, data);
    return response.data;
  } catch (error) {
    // Capturamos el mensaje específico del backend para el Toast
    throw error.response?.data?.message || "Error al actualizar la fase";
  }
};

export const desactivarFase = async (id) => {
  const response = await api.put(`/fases/${id}/desactivar`);
  return response.data;
};
