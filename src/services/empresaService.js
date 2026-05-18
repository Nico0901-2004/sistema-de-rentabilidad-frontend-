import api from "./api";

// GET /empresas
export const getEmpresas = async() => {
    const response = await api.get("/empresas");
    return response.data;
};

// GET /empresas/:id
export const getEmpresaById = async(id) => {
    const response = await api.get(`/empresas/${id}`);
    return response.data;
};

// POST /empresas
export const createEmpresa = async(empresaData) => {
    const response = await api.post("/empresas", empresaData);
    return response.data;
};

// PUT /empresas/:id
export const updateEmpresa = async(id, empresaData) => {
    const response = await api.put(`/empresas/${id}`, empresaData);
    return response.data;
};

