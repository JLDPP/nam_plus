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
import ProtectedRoute from "./routes/protected.route";
import Codigo from "./pages/codigo";
import Qr from "./pages/qr";
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
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
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

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);