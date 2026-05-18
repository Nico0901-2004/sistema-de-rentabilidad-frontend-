import api from "./api";

export const getUsuarios = async () => {
  const response = await api.get("/usuarios");
  return response.data;
};

export const getUsuarioById = async (id) => {
  const response = await getUsuarios();
  const usuarios = response?.data || [];
  const usuario = usuarios.find((item) => Number(item.id_usuario) === Number(id));

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  return { success: true, data: usuario };
};

export const getPropietarios = async () => {
  const response = await api.get("/usuarios/propietarios");
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

export const createHistorialSueldo = async (data) => {
  const response = await api.post("/historiales", data);
  return response.data;
};

export const deleteUsuario = async (id) => {
  const response = await api.delete(`/usuarios/${id}`);
  return response.data;
};

