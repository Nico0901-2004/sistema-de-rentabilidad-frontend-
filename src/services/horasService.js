import api from "./api";

export const getHorasByLider = async () => {
  const response = await api.get("/horas/lider");
  return response.data;
};

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

export const deleteHora = async (id) => {
  const response = await api.delete(`/horas/${id}`);
  return response.data;
};

export const marcarEntrada = async () => {
  // Simulación para cumplimiento de HU hasta que el backend esté listo
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Entrada registrada correctamente (Simulado)",
        data: { hora_entrada: new Date().toISOString() }
      });
    }, 500);
  });

  /* // Código real para el futuro:
  const response = await api.post('/asistencia/entrada');
  return response.data; 
  */
};

// src/services/horasService.js
// ... (marcarEntrada existente)

export const marcarSalida = async () => {
  return new Promise((resolve, reject) => {
    const tieneEntrada = localStorage.getItem("entrada_marcada") === "true";

    setTimeout(() => {
      if (!tieneEntrada) {
        reject("No se puede marcar salida sin haber registrado una entrada.");
      } else {
        resolve({
          success: true,
          message: "Salida registrada correctamente. Por favor, registre sus horas trabajadas.",
          data: { hora_salida: new Date().toISOString() }
        });
      }
    }, 500);
  });
};


export const getMisMarcajes = async () => {
  // Simulación para cumplimiento de HU 34
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: [
          { id: 1, fecha: "2024-05-13", entrada: "08:00:15", salida: "17:05:30" },
          { id: 2, fecha: "2024-05-14", entrada: "08:10:00", salida: "17:15:20" },
          { id: 3, fecha: "2024-05-15", entrada: "07:55:40", salida: "16:50:00" },
        ]
      });
    }, 600);
  });

  /* // Código real futuro:
  const response = await api.get('/asistencia/mis-marcajes');
  return response.data;
  */
};

