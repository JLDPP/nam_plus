
/*
  ARCHIVO: main.tsx

  FUNCIÓN:
  Define las rutas principales de la aplicación.

  MODIFICACIONES:
  - Se conservan todas las rutas existentes.
  - Se mantienen las rutas protegidas.
  - Se agregan las rutas de Canjes-Puntos:
      /puntos
      /canjes
      /historial-canjes
*/

import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Configuracion from "./pages/configuracion";
import Codigo from "./pages/codigo";
import Qr from "./pages/qr";
import Promociones from "./pages/promociones";
import PromocionDetalle from "./pages/promocionDetalle";

// Nuevas pantallas de Canjes-Puntos
import Puntos from "./pages/puntos";
import Canjes from "./pages/canjes";
import { HistorialCanjes } from "./pages/historialCanjes";

import ProtectedRoute from "./routes/protected.route";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Rutas públicas */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Dashboard */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Configuración */}

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          }
        />

        {/* Escaneo QR */}

        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <Qr />
            </ProtectedRoute>
          }
        />

        {/* Ingreso manual de código */}

        <Route
          path="/codigo"
          element={
            <ProtectedRoute>
              <Codigo />
            </ProtectedRoute>
          }
        />

        {/* Promociones */}

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

        {/* Sistema de puntos */}

        <Route
          path="/puntos"
          element={
            <ProtectedRoute>
              <Puntos />
            </ProtectedRoute>
          }
        />

        {/* Catálogo de recompensas y canjes */}

        <Route
          path="/canjes"
          element={
            <ProtectedRoute>
              <Canjes />
            </ProtectedRoute>
          }
        />

        {/* Historial de canjes */}

        <Route
          path="/historial-canjes"
          element={
            <ProtectedRoute>
              <HistorialCanjes />
            </ProtectedRoute>
          }
        />

        {/* Ruta predeterminada */}

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
