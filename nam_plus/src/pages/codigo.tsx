
/*
  ARCHIVO: codigo.tsx

  FUNCIÓN:
  Permite ingresar manualmente un código
  de ticket para obtener puntos en Ñam+.

  FUNCIONES CONSERVADAS:
  - Validación de código vacío.
  - Validación de longitud mínima.
  - Validación con redeemCode().
  - Bloqueo del formulario durante la consulta.
  - Mensajes de resultado.
  - Navegación al dashboard.
  - Estilos actuales.

  MEJORA:
  - Traducción global español/inglés.
*/

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { redeemCode } from "../services/redeem.service";
import "../styles/codigo.css";

export default function Codigo() {
  const { t } = useTranslation();

  const [code, setCode] = useState("");
  const [messageKey, setMessageKey] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // VALIDAR CÓDIGO MANUAL
  // ==========================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanCode = code.trim();

    if (!cleanCode) {
      setServerMessage("");
      setMessageKey("code.invalid");
      return;
    }

    if (cleanCode.length < 4) {
      setServerMessage("");
      setMessageKey("code.tooShort");
      return;
    }

    setLoading(true);
    setMessageKey("");
    setServerMessage("");

    try {
      // Conservamos la función original.
      const result = await redeemCode(cleanCode);

      // Conservamos el mensaje real del backend.
      setServerMessage(result.message);

    } catch (error) {
      console.error(
        "Error procesando el código:",
        error
      );

      setMessageKey("code.processingError");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="code-page">
      <div className="code-container">

        <div className="code-header">
          <div>
            <h1>{t("code.title")}</h1>

            <p>{t("code.subtitle")}</p>
          </div>

          <button
            type="button"
            className="code-back-btn"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            {t("common.back")}
          </button>
        </div>

        <form
          className="code-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="ticket-code">
            {t("code.label")}
          </label>

          <input
            id="ticket-code"
            type="text"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            placeholder={t("code.placeholder")}
            autoComplete="off"
            disabled={loading}
          />

          <button
            type="submit"
            className="code-submit-btn"
            disabled={loading}
          >
            {loading
              ? t("code.validating")
              : t("code.submit")}
          </button>

          {(messageKey || serverMessage) && (
            <p className="code-message">
              {messageKey
                ? t(messageKey)
                : serverMessage}
            </p>
          )}
        </form>

      </div>
    </div>
  );
}
