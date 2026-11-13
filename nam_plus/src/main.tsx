
/*
  ARCHIVO: main.tsx

  FUNCIÓN:
  Define las rutas principales de la aplicación Ñam+.

  MODIFICACIONES:
  - Se conservan todas las rutas existentes.
  - Se mantienen las rutas protegidas.
  - Se conserva el sistema de puntos y canjes.
  - Se conserva la administración de canjes.
  - Se agrega la administración de recompensas.
  - Se restringen las pantallas administrativas
    a usuarios restaurante y admin.
*/

import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ==========================================
// AUTENTICACIÓN
// ==========================================

import Login from "./pages/login";
import Register from "./pages/register";

// ==========================================
// PANTALLAS PRINCIPALES
// ==========================================

import Dashboard from "./pages/dashboard";
import Configuracion from "./pages/configuracion";

// ==========================================
// QR Y CÓDIGOS
// ==========================================

import Codigo from "./pages/codigo";
import Qr from "./pages/qr";

// ==========================================
// PROMOCIONES
// ==========================================

import Promociones from "./pages/promociones";
import PromocionDetalle from "./pages/promocionDetalle";

// ==========================================
// PUNTOS Y CANJES
// ==========================================

import Puntos from "./pages/puntos";
import Canjes from "./pages/canjes";
import { HistorialCanjes } from "./pages/historialCanjes";

// ==========================================
// ADMINISTRACIÓN DE CANJES
// ==========================================

import CanjesRestaurante from "./pages/canjesRestaurante";

// ==========================================
// ADMINISTRACIÓN DE RECOMPENSAS
// ==========================================

import AdminRecompensas from "./pages/adminRecompensas";

// ==========================================
// PROTECCIÓN DE RUTAS
// ==========================================

import ProtectedRoute from "./routes/protected.route";

import "./index.css";

// ==========================================
// VALIDACIÓN DE ROLES
// ==========================================

function RestauranteRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const storedUser = localStorage.getItem("user");

  let role = "";

  try {
    const user = storedUser
      ? JSON.parse(storedUser)
      : null;

    role = user?.role || "";
  } catch {
    role = "";
  }

  // Solo restaurante y admin pueden entrar.
  // El backend debe validar los permisos reales.
  if (!["restaurante", "admin"].includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ==========================================
// RUTAS PRINCIPALES
// ==========================================

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* ================================= */}
        {/* RUTAS PÚBLICAS */}
        {/* ================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ================================= */}
        {/* DASHBOARD */}
        {/* ================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* CONFIGURACIÓN */}
        {/* ================================= */}

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* QR Y CÓDIGOS */}
        {/* ================================= */}

        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <Qr />
            </ProtectedRoute>
          }
        />

        <Route
          path="/codigo"
          element={
            <ProtectedRoute>
              <Codigo />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* PROMOCIONES */}
        {/* ================================= */}

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

        {/* ================================= */}
        {/* SISTEMA DE PUNTOS */}
        {/* ================================= */}

        <Route
          path="/puntos"
          element={
            <ProtectedRoute>
              <Puntos />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* CATÁLOGO DE RECOMPENSAS Y CANJES */}
        {/* ================================= */}

        <Route
          path="/canjes"
          element={
            <ProtectedRoute>
              <Canjes />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* HISTORIAL DE CANJES DEL CLIENTE */}
        {/* ================================= */}

        <Route
          path="/historial-canjes"
          element={
            <ProtectedRoute>
              <HistorialCanjes />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* ADMINISTRACIÓN DE CANJES */}
        {/* SOLO RESTAURANTE Y ADMIN */}
        {/* ================================= */}

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

        {/* ================================= */}
        {/* ADMINISTRACIÓN DE RECOMPENSAS */}
        {/* SOLO RESTAURANTE Y ADMIN */}
        {/* ================================= */}

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

        {/* ================================= */}
        {/* RUTA PREDETERMINADA */}
        {/* ================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
