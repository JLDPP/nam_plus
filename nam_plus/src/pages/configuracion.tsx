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

  const translations = {
    es: {
      title: "Configuración",
      subtitle: "Personaliza tu experiencia en Ñam+",
      back: "Volver",

      appearance: "Apariencia",
      appearanceDescription:
        "Selecciona cómo quieres ver la aplicación.",

      dark: "Oscuro",
      light: "Claro",

      language: "Idioma",
      languageDescription:
        "Selecciona el idioma de la aplicación.",

      spanish: "Español",
      english: "English",
    },

    en: {
      title: "Settings",
      subtitle: "Customize your Ñam+ experience",
      back: "Back",

      appearance: "Appearance",
      appearanceDescription:
        "Choose how you want the application to look.",

      dark: "Dark",
      light: "Light",

      language: "Language",
      languageDescription:
        "Select the application language.",

      spanish: "Español",
      english: "English",
    },
  };

  const t = translations[language];

  return (
    <div className={`settings-page ${theme}`}>
      <div className="settings-container">
        <div className="settings-header">
          <div>
            <h1>{t.title}</h1>

            <p>{t.subtitle}</p>
          </div>

          <button
            className="back-btn"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            ← {t.back}
          </button>
        </div>

        <section className="settings-card">
          <div>
            <h2>{t.appearance}</h2>

            <p>
              {t.appearanceDescription}
            </p>
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
              🌙 {t.dark}
            </button>

            <button
              className={
                theme === "light"
                  ? "option-btn active"
                  : "option-btn"
              }
              onClick={() => setTheme("light")}
            >
              ☀️ {t.light}
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div>
            <h2>{t.language}</h2>

            <p>
              {t.languageDescription}
            </p>
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
              🇲🇽 {t.spanish}
            </button>

            <button
              className={
                language === "en"
                  ? "option-btn active"
                  : "option-btn"
              }
              onClick={() => setLanguage("en")}
            >
              🇺🇸 {t.english}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}