import api from "./api";

export const getUsuarios = async () => {
  const response = await api.get("/usuarios");
  return response.data;
};

export const getUsuarioById = async (id) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};

export const getPropietarios = async () => {
  const response = await api.get("/usuarios");
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/usuarios", data);
  return response.data;
};

export const updateUsuario = async (id, data) => {
  const response = await api.put(`/usuarios/${id}`, data);
  return response.data;
};

export const desactivarUsuario = async (id) => {
  const response = await api.put(`/usuarios/${id}/desactivar`);
  return response.data;
};

export const revocarEmpresaPropietario = async (id) => {
  const response = await api.put(`/usuarios/${id}/revocar-empresa`);
  return response.data;
};

export const createHistorialSueldo = async (data) => {
  const response = await api.post("/historiales", data);
  return response.data;
};

export const deleteUsuario = async (id) => {
  const response = await api.delete(`/usuarios/${id}`);
  return response.data;
};

