
import axios from "axios";

// ==========================================
// CONFIGURACIÓN DE API
// ==========================================

export const api = axios.create({
  // Usa la URL configurada o el mismo origen.
  // El proxy de Vite enviará /api al backend.
  baseURL: import.meta.env.VITE_API_URL || "/",

  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// CONFIGURAR TOKEN JWT
// ==========================================

export function setAuth(token: string | null) {
  if (token) {
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common[
      "Authorization"
    ];
  }
}

// ==========================================
// RECUPERAR SESIÓN GUARDADA
// ==========================================

setAuth(localStorage.getItem("token"));

// ==========================================
// INTERCEPTOR DE RESPUESTAS
// ==========================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setAuth(null);

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
