
import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./i18n";
import "./index.css";

// AUTENTICACIÓN
import Login from "./pages/login";
import Register from "./pages/register";

// CLIENTES
import Dashboard from "./pages/dashboard";
import Configuracion from "./pages/configuracion";
import Codigo from "./pages/codigo";
import Qr from "./pages/qr";
import Promociones from "./pages/promociones";
import PromocionDetalle from "./pages/promocionDetalle";
import Puntos from "./pages/puntos";
import Canjes from "./pages/canjes";
import { HistorialCanjes } from "./pages/historialCanjes";

// RESTAURANTES
import RestauranteInicio from "./pages/restaurante/RestauranteInicio";
import RestaurantePromociones from "./pages/restaurante/RestaurantePromociones";

import CanjesRestaurante from "./pages/canjesRestaurante";
import AdminRecompensas from "./pages/adminRecompensas";
import GenerarTicket from "./pages/generarTicket";

// PROTECCIÓN
import ProtectedRoute from "./routes/protected.route";

// ==========================================
// CONSULTAR ROL
// ==========================================

function getUserRole(): string {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    return user?.role || "";
  } catch {
    return "";
  }
}

// ==========================================
// DASHBOARD SEGÚN EL ROL
// ==========================================

function DashboardPorRol() {
  const role = getUserRole();

  if (role === "restaurante") {
    return <Navigate to="/restaurante" replace />;
  }

  if (role === "cliente" || role === "admin") {
    return <Dashboard />;
  }

  return <Navigate to="/login" replace />;
}

// ==========================================
// RUTAS DE RESTAURANTES
// ==========================================

function RestauranteRoute({
  children,
  soloRestaurante = false,
}: {
  children: React.ReactNode;
  soloRestaurante?: boolean;
}) {
  const role = getUserRole();

  const allowedRoles = soloRestaurante
    ? ["restaurante"]
    : ["restaurante", "admin"];

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ==========================================
// APLICACIÓN
// ==========================================

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* RUTAS PÚBLICAS */}

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* DASHBOARD GENERAL */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPorRol />
            </ProtectedRoute>
          }
        />

        {/* DASHBOARD RESTAURANTE */}

        <Route
          path="/restaurante"
          element={
            <ProtectedRoute>
              <RestauranteRoute soloRestaurante>
                <RestauranteInicio />
              </RestauranteRoute>
            </ProtectedRoute>
          }
        />

        {/* PUBLICAR PROMOCIONES */}

        <Route
          path="/restaurante/promociones"
          element={
            <ProtectedRoute>
              <RestauranteRoute soloRestaurante>
                <RestaurantePromociones mode="publicar" />
              </RestauranteRoute>
            </ProtectedRoute>
          }
        />

        {/* HISTORIAL DE PROMOCIONES */}

        <Route
          path="/restaurante/promociones/historial"
          element={
            <ProtectedRoute>
              <RestauranteRoute soloRestaurante>
                <RestaurantePromociones mode="historial" />
              </RestauranteRoute>
            </ProtectedRoute>
          }
        />

        {/* CONFIGURACIÓN */}

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          }
        />

        {/* ESCANEAR QR */}

        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <Qr />
            </ProtectedRoute>
          }
        />

        {/* CÓDIGO MANUAL */}

        <Route
          path="/codigo"
          element={
            <ProtectedRoute>
              <Codigo />
            </ProtectedRoute>
          }
        />

        {/* CATÁLOGO DE PROMOCIONES */}

        <Route
          path="/promociones"
          element={
            <ProtectedRoute>
              <Promociones />
            </ProtectedRoute>
          }
        />

        <Route
          path="/promociones/:id"
          element={
            <ProtectedRoute>
              <PromocionDetalle />
            </ProtectedRoute>
          }
        />

        {/* PUNTOS */}

        <Route
          path="/puntos"
          element={
            <ProtectedRoute>
              <Puntos />
            </ProtectedRoute>
          }
        />

        {/* CANJES CLIENTES */}

        <Route
          path="/canjes"
          element={
            <ProtectedRoute>
              <Canjes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/historial-canjes"
          element={
            <ProtectedRoute>
              <HistorialCanjes />
            </ProtectedRoute>
          }
        />

        {/* CANJES RESTAURANTE */}

        <Route
          path="/canjes-restaurante"
          element={
            <ProtectedRoute>
              <RestauranteRoute>
                <CanjesRestaurante />
              </RestauranteRoute>
            </ProtectedRoute>
          }
        />

        {/* ADMINISTRACIÓN DE RECOMPENSAS */}

        <Route
          path="/admin-recompensas"
          element={
            <ProtectedRoute>
              <RestauranteRoute>
                <AdminRecompensas />
              </RestauranteRoute>
            </ProtectedRoute>
          }
        />

        {/* GENERACIÓN DE TICKETS */}

        <Route
          path="/generar-ticket"
          element={
            <ProtectedRoute>
              <RestauranteRoute>
                <GenerarTicket />
              </RestauranteRoute>
            </ProtectedRoute>
          }
        />

        {/* RUTA PREDETERMINADA */}

        <Route
          path="*"
          element={
            <Navigate to="/login" replace />
          }
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
