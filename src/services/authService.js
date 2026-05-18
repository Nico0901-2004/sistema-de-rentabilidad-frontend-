import api from "./api";

export const login = async (formData) => {
  const response = await api.post("/auth/login", formData);
  return response.data;
};

export const getOwnerContact = async (email) => {
  const response = await api.post("/auth/get-owner-contact", { email });
  return response.data;
};
