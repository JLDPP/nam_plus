import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";

export default function Register() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
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
          "Error al crear la cuenta"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <div className="nam-logo">
            Ñ
          </div>

          <h1>Crear cuenta</h1>

          <p className="muted">
            Únete a Ñam+ y empieza a disfrutar
            promociones y recompensas.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={onSubmit}
        >
          <div className="input-group">
            <label>Nombre</label>

            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />
          </div>

          <div className="input-group">
            <label>Correo electrónico</label>

            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>

            <div className="pass">
              <input
                type={show ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setShow((s) => !s)
                }
              >
                {show ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Confirmar contraseña</label>

            <input
              type={show ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
            />
          </div>

          {error && (
            <div className="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading
              ? "Creando cuenta..."
              : "Crear cuenta"}
          </button>
        </form>

        <div className="footer-links">
          <span className="muted">
            ¿Ya tienes cuenta?
          </span>

          <Link
            to="/login"
            className="link"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}