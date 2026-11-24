
import axios from "axios";
import { readSnapshot, restoreSession, saveSnapshot } from "./services/offlineStore";

const cachedReads: Record<string, string> = {
  "/api/rewards": "cliente",
  "/api/points/balance": "cliente",
  "/api/points/history": "cliente",
  "/api/redemptions/history": "cliente",
  "/api/rewards/manage": "restaurante",
  "/api/redemptions/restaurant": "restaurante",
};

async function snapshotAccount(config: { method?: string; url?: string; headers?: { get?: (name: string) => unknown } }) {
  if (config.method !== "get" || !config.url || !cachedReads[config.url]) return;
  const token = localStorage.getItem("token");
  if (!token || config.headers?.get?.("Authorization") !== `Bearer ${token}`) return;
  const session = await restoreSession(token).catch(() => undefined);
  return session?.account.role === cachedReads[config.url] ? session.account : undefined;
}

// ==========================================
// CONFIGURACIÓN DE API
// ==========================================

export const api = axios.create({
  timeout: 15_000,
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
  async (response) => {
    const account = await snapshotAccount(response.config);
    if (account) await saveSnapshot(account, response.config.url!, response.data).catch(() => {});
    return response;
  },

  async (error) => {
    if (error.response?.status === 401 && error.config?.url !== "/api/auth/login" &&
        error.config?.headers?.get?.("Authorization") === `Bearer ${localStorage.getItem("token")}`) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setAuth(null);

      window.location.href = "/login";
    }

    if ((!error.response || [502, 503, 504].includes(error.response.status)) && error.code !== "ERR_CANCELED" && error.config) {
      const account = await snapshotAccount(error.config);
      if (account) {
        const saved = await readSnapshot(account, error.config.url).catch(() => undefined);
        if (saved) {
          window.dispatchEvent(new CustomEvent("nam-plus:snapshot-used", { detail: saved.savedAt }));
          return { data: saved.data, status: 200, statusText: "Cached", headers: {}, config: error.config };
        }
      }
    }

    return Promise.reject(error);
  }
);
