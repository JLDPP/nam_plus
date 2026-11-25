import AuthLayout from "../components/AuthLayout";
import InstallPwa from "../components/InstallPwa";

import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { api, setAuth } from "../api";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post(
        "/api/auth/login",
        {
          email: email.trim(),
          password,
        }
      );

      // Validar respuesta del servidor
      if (
        typeof data.token !== "string" ||
        !data.token ||
        !data.user ||
        !["cliente", "restaurante", "admin"].includes(
          data.user.role
        )
      ) {
        setError(
          "No se pudo identificar el tipo de usuario"
        );

        return;
      }

      // Guardar sesión
      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setAuth(data.token);

      // =====================================
      // REDIRECCIÓN SEGÚN EL ROL
      // =====================================

      if (data.user.role === "restaurante") {
        nav("/restaurante", {
          replace: true,
        });
      } else {
        nav("/dashboard", {
          replace: true,
        });
      }

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          "No se pudo iniciar sesión"
        );
      } else {
        setError(
          "Ocurrió un error inesperado"
        );
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" description="Acumula puntos con tus compras y canjéalos por recompensas.">
      <form
        className="auth-form"
        onSubmit={onSubmit}
        autoComplete="off"
      >

        <div className="input-group">
          <label htmlFor="email">
            Correo electrónico
          </label>

          <input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            autoComplete="off"
            required
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">
            Contraseña
          </label>

          <div className="pass">
            <input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="off"
              required
              disabled={loading}
            />

            <button
              type="button"
              className="ghost"
              onClick={() =>
                setShow((current) => !current)
              }
              aria-label={
                show
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
            >
              {show ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="alert"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn primary"
          disabled={loading}
        >
          {loading
            ? "Ingresando..."
            : "Iniciar sesión"}
        </button>
      </form>

      <div className="footer-links">
        <span className="muted">
          ¿No tienes cuenta?
        </span>

        <Link
          to="/register"
          className="link"
        >
          Crear una cuenta
        </Link>
      </div>

      <InstallPwa />
    </AuthLayout>
  );
}