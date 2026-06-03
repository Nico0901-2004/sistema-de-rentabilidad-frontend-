import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Agregar interceptor global para capturar respuestas del backend
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa (200, 201, etc.), la dejamos pasar tal cual
    return response;
  },
  (error) => {
    // Verificar si el error es 401 (No Autorizado / Token expirado o inválido)
    if (error.response && error.response.status === 401) {
      
      // 1. Limpiar cualquier rastro de la sesión en el navegador
      try {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // 2. Disparar el evento AUTH_LOGOUT para que tu AuthContext 
        // lo detecte y actualice el estado de React en todas las pestañas
        const event = { type: "AUTH_LOGOUT", at: Date.now() };
        localStorage.setItem("auth_event", JSON.stringify(event));
      } catch (e) {
        // Ignoramos errores si el navegador bloquea el storage en modo estricto
      }

      // 3. Redirigir al login si el usuario no está ya en esa ruta
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Rechazar la promesa para que el componente que hizo la petición 
    // pueda mostrar su propio mensaje (ej. toast.error("Token inválido"))
    return Promise.reject(error);
  }
);

export default api;