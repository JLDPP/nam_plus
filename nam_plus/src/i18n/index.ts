
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./locales/es.json";
import en from "./locales/en.json";

// Recuperar el idioma guardado en Configuración
const savedLanguage =
  localStorage.getItem("language") === "en"
    ? "en"
    : "es";

document.documentElement.lang = savedLanguage;

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },

  lng: savedLanguage,
  fallbackLng: "es",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
