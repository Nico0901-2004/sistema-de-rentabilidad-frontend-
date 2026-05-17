import api from "./api";

export const getProyectos = async () => {
  const response = await api.get("/proyectos");
  return response.data;
};

export const getRentabilidadProyectos = getProyectos;

export const getMisProyectos = async () => {
  const response = await api.get("/proyectos");
  return response.data;
};

export const getProyectosDisponibles = async () => {
  const response = await api.get("/proyectos/disponibles");
  return response.data;
};

export const getProyectoById = async (id) => {
  const response = await api.get(`/proyectos/${id}`);
  return response.data;
};

export const createProyecto = async (data) => {
  const response = await api.post("/proyectos", data);
  return response.data;
};

export const updateProyecto = async (id, data) => {
  const response = await api.put(`/proyectos/${id}`, data);
  return response.data;
};

export const desactivarProyecto = async (id) => {
  const response = await api.put(`/proyectos/${id}/desactivar`);
  return response.data;
};

export const eliminarProyecto = desactivarProyecto;

// src/services/proyectoService.js
export const finalizarProyecto = async (id, data) => {
  const response = await api.put(`/proyectos/${id}/finalizar`, data);
  return response.data;
};

export const getHorasResumenProyecto = async (id) => {
  const response = await api.get(`/proyectos/${id}/horas-resumen`);
  return response.data;
};

export const getEmpleadosProyecto = async (id) => {
  const response = await api.get(`/proyectos/${id}/empleados`);
  return response.data;
};

