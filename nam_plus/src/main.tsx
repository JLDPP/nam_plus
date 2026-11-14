
/*
  ARCHIVO: main.tsx

  FUNCIÓN:
  Define las rutas principales de la aplicación Ñam+.

  FUNCIONES CONSERVADAS:
  - Todas las rutas existentes.
  - Autenticación y rutas protegidas.
  - Sistema de puntos y canjes.
  - Administración de canjes.
  - Administración de recompensas.
  - Generación de tickets QR.
  - Validación de roles restaurante y admin.

  NUEVA INTEGRACIÓN:
  - Inicialización del sistema global de idiomas.
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
// SISTEMA GLOBAL DE IDIOMAS
// ==========================================

import "./i18n";

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
// QR Y CÓDIGOS DEL CLIENTE
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
// GENERACIÓN DE TICKETS QR
// ==========================================

import GenerarTicket from "./pages/generarTicket";

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
  // El backend valida los permisos reales.
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
        {/* ESCANEO QR DEL CLIENTE */}
        {/* ================================= */}

        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <Qr />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* INGRESO MANUAL DE CÓDIGOS */}
        {/* ================================= */}

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
        {/* CATÁLOGO DE RECOMPENSAS */}
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
        {/* GENERAR TICKETS QR */}
        {/* SOLO RESTAURANTE Y ADMIN */}
        {/* ================================= */}

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
