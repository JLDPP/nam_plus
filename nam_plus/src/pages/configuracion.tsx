import { useEffect, useState } from "react";
import "../styles/configuracion.css";

export default function Configuracion() {
  const [theme, setTheme] = useState<"dark" | "light">(
    (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );

  const [language, setLanguage] = useState<"es" | "en">(
    (localStorage.getItem("language") as "es" | "en") || "es"
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  return (
    <div className={`settings-page ${theme}`}>
      <div className="settings-container">
        <div className="settings-header">
          <div>
            <h1>Configuración</h1>
            <p>Personaliza tu experiencia en Ñam+</p>
          </div>

          <button
            className="back-btn"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            Volver
          </button>
        </div>

        <section className="settings-card">
          <div>
            <h2>Apariencia</h2>
            <p>Selecciona cómo quieres ver la aplicación.</p>
          </div>

          <div className="settings-options">
            <button
              className={
                theme === "dark"
                  ? "option-btn active"
                  : "option-btn"
              }
              onClick={() => setTheme("dark")}
            >
              🌙 Oscuro
            </button>

            <button
              className={
                theme === "light"
                  ? "option-btn active"
                  : "option-btn"
              }
              onClick={() => setTheme("light")}
            >
              ☀️ Claro
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div>
            <h2>Idioma</h2>
            <p>Selecciona el idioma de la aplicación.</p>
          </div>

          <div className="settings-options">
            <button
              className={
                language === "es"
                  ? "option-btn active"
                  : "option-btn"
              }
              onClick={() => setLanguage("es")}
            >
              Español
            </button>

            <button
              className={
                language === "en"
                  ? "option-btn active"
                  : "option-btn"
              }
              onClick={() => setLanguage("en")}
            >
              English
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}