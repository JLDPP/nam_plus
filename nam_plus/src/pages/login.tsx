import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";
import logo from "../assets/logo.jpeg";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", data.token);

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setAuth(data.token);

      nav("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Correo o contraseña incorrectos"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <img
            src={logo}
            alt="Logo de Ñam+"
            className="nam-logo-img"
          />

          <p className="muted">
            Descubre promociones, acumula puntos y disfruta
            tus restaurantes favoritos.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={onSubmit}
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
              autoComplete="email"
              required
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
                autoComplete="current-password"
                required
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
      </div>
    </div>
  );
}