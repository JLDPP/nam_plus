/*
  ARCHIVO: main.tsx

  FUNCIÓN:
  Define las rutas principales de la aplicación.

  MODIFICACIONES REALIZADAS:
  - Se agregó la ruta /codigo.
  - Se agregó la ruta /qr.
  - Se agregó la ruta /promociones.
  - Se agregó la ruta /promociones/:id para ver el detalle de una promoción.
  - Las rutas protegidas utilizan ProtectedRoute.
  - Solo los usuarios con sesión iniciada pueden acceder.
  - Si no existe token, ProtectedRoute redirige al login.
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

import ProtectedRoute from "./routes/protected.route";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          }
        />

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