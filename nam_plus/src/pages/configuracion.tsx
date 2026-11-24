import InstallPwa from "../components/InstallPwa";

/*
  ARCHIVO: configuracion.tsx

  FUNCIÓN:
  Permite personalizar la apariencia y el idioma
  de la aplicación Ñam+.

  FUNCIONES CONSERVADAS:
  - Selección de tema oscuro y claro.
  - Guardado del tema en localStorage.
  - Selección de idioma Español / English.
  - Guardado del idioma en localStorage.
  - Traducción de esta pantalla.
  - Botón para volver al dashboard.
  - Conservación de las preferencias al recargar.

  NUEVA MEJORA:
  - Sincronización del idioma con i18next.
  - Actualización del idioma global de la aplicación.
*/

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import i18n from "../i18n";
import "../styles/configuracion.css";

type Theme = "dark" | "light";
type Language = "es" | "en";

export default function Configuracion() {

  // ==========================================
  // CONFIGURACIÓN DEL TEMA
  // ==========================================

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");

    return savedTheme === "dark" ? "dark" : "light";
  });

  // ==========================================
  // CONFIGURACIÓN DEL IDIOMA
  // ==========================================

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language");

    return savedLanguage === "en" ? "en" : "es";
  });

  // ==========================================
  // GUARDAR TEMA
  // ==========================================

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // ==========================================
  // GUARDAR Y SINCRONIZAR IDIOMA GLOBAL
  // ==========================================

  useEffect(() => {
    localStorage.setItem("language", language);

    // Sincronizar todas las pantallas
    // que utilizan react-i18next.
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }

    // Actualizar el idioma del documento.
    document.documentElement.lang = language;

  }, [language]);

  // ==========================================
  // TRADUCCIONES DE CONFIGURACIÓN
  // ==========================================

  const translations = {
    es: {
      title: "Preferencias",
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

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* ENCABEZADO */}
        <div className="settings-header">
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <button
            type="button"
            className="back-btn"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            ← {t.back}
          </button>
        </div>

        {/* APARIENCIA */}
        <section className="settings-card">
          <div>
            <h2>{t.appearance}</h2>
            <p>{t.appearanceDescription}</p>
          </div>

          <div className="settings-options">
            <button
              type="button"
              className={
                theme === "dark"
                  ? "option-btn active"
                  : "option-btn"
              }
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon size={17} aria-hidden="true" /> {t.dark}
            </button>

            <button
              type="button"
              className={
                theme === "light"
                  ? "option-btn active"
                  : "option-btn"
              }
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun size={17} aria-hidden="true" /> {t.light}
            </button>
          </div>
        </section>

        {/* IDIOMA */}
        <section className="settings-card">
          <div>
            <h2>{t.language}</h2>
            <p>{t.languageDescription}</p>
          </div>

          <div className="settings-options">
            <button
              type="button"
              className={
                language === "es"
                  ? "option-btn active"
                  : "option-btn"
              }
              aria-pressed={language === "es"}
              onClick={() => setLanguage("es")}
            >
              {t.spanish}
            </button>

            <button
              type="button"
              className={
                language === "en"
                  ? "option-btn active"
                  : "option-btn"
              }
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              {t.english}
            </button>
          </div>
        </section>

        <InstallPwa />
      </div>
    </div>
  );
}
