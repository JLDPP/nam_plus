import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./i18n";
import "@fontsource-variable/nunito";
import "./index.css";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Configuracion from "./pages/configuracion";
import Perfil from "./pages/perfil";
import AdminInicio from "./pages/adminInicio";
import AdminCuentas from "./pages/adminCuentas";
import Codigo from "./pages/codigo";
import Qr from "./pages/qr";
import Puntos from "./pages/puntos";
import Canjes from "./pages/canjes";
import { HistorialCanjes } from "./pages/historialCanjes";
import RestauranteInicio from "./pages/restaurante/RestauranteInicio";
import CanjesRestaurante from "./pages/canjesRestaurante";
import AdminRecompensas from "./pages/adminRecompensas";
import GenerarTicket from "./pages/generarTicket";
import ProtectedRoute, { useAccount } from "./routes/protected.route";

function DashboardPorRol() {
  const { role } = useAccount();
  if (role === "restaurante") return <Navigate to="/restaurante" replace />;
  return role === "admin" ? <AdminInicio /> : <Dashboard />;
}

document.documentElement.dataset.theme =
  localStorage.getItem("theme") === "dark" ? "dark" : "light";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPorRol /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />

        <Route path="/qr" element={<ProtectedRoute roles={["cliente"]}><Qr /></ProtectedRoute>} />
        <Route path="/codigo" element={<ProtectedRoute roles={["cliente"]}><Codigo /></ProtectedRoute>} />
        <Route path="/puntos" element={<ProtectedRoute roles={["cliente"]}><Puntos /></ProtectedRoute>} />
        <Route path="/canjes" element={<ProtectedRoute roles={["cliente"]}><Canjes /></ProtectedRoute>} />
        <Route path="/historial-canjes" element={<ProtectedRoute roles={["cliente"]}><HistorialCanjes /></ProtectedRoute>} />
        <Route path="/promociones/*" element={<Navigate to="/canjes" replace />} />

        <Route path="/restaurante" element={<ProtectedRoute roles={["restaurante"]}><RestauranteInicio /></ProtectedRoute>} />
        <Route path="/generar-ticket" element={<ProtectedRoute roles={["restaurante"]}><GenerarTicket /></ProtectedRoute>} />
        <Route path="/canjes-restaurante" element={<ProtectedRoute roles={["restaurante"]}><CanjesRestaurante /></ProtectedRoute>} />
        <Route path="/restaurante/transferir-puntos" element={<Navigate to="/dashboard" replace />} />
        <Route path="/restaurante/promociones/*" element={<Navigate to="/admin-recompensas" replace />} />

        <Route path="/admin-recompensas" element={<ProtectedRoute roles={["restaurante", "admin"]}><AdminRecompensas /></ProtectedRoute>} />
        <Route path="/admin-cuentas" element={<ProtectedRoute roles={["admin"]}><AdminCuentas /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
