
/*
  ARCHIVO: puntos.tsx

  FUNCIÓN:
  Mostrar el saldo real de puntos del usuario.

  FUNCIONES CONSERVADAS:
  - Consulta de puntos desde MongoDB.
  - Estados de carga y error.
  - Navegación al dashboard.
  - Acceso a recompensas.
  - Acceso al historial de canjes.
  - Diseño y clases CSS existentes.

  MEJORA:
  - Traducción español/inglés con i18next.
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "../styles/puntos.css";

import { getPointsBalance } from "../services/points.service.ts";

export default function Puntos() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // CONSULTAR SALDO REAL DE PUNTOS
  // ==========================================

  useEffect(() => {
    async function loadPoints() {
      try {
        setLoading(true);
        setError("");

        const balance = await getPointsBalance();

        setPoints(balance);
      } catch (err) {
        console.error("Error consultando puntos:", err);
        setError("points.loadError");
      } finally {
        setLoading(false);
      }
    }

    void loadPoints();
  }, []);

  // ==========================================
  // IDIOMA PARA FORMATO DE NÚMEROS
  // ==========================================

  const locale =
    i18n.resolvedLanguage?.startsWith("en")
      ? "en-US"
      : "es-MX";

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="points-page">
      <header className="points-header">
        <button
          className="points-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← {t("common.back")}
        </button>

        <h1>{t("points.title")}</h1>

        <p>Ñam+ Rewards</p>
      </header>

      <main className="points-container">
        <section className="points-balance-card">
          <span className="points-icon">⭐</span>

          <h2>{t("points.availableBalance")}</h2>

          {loading ? (
            <p className="points-loading">
              {t("points.loading")}
            </p>
          ) : (
            <div className="points-total">
              {points.toLocaleString(locale)}
              <span> pts</span>
            </div>
          )}

          {error && (
            <p className="points-error">
              {t(error)}
            </p>
          )}

          <p>
            {t("points.balanceDescription")}
          </p>
        </section>

        <section className="points-info-card">
          <h2>{t("points.howToEarn")}</h2>

          <div className="points-info-item">
            <span>🛒</span>

            <div>
              <h3>{t("points.step1Title")}</h3>
              <p>{t("points.step1Description")}</p>
            </div>
          </div>

          <div className="points-info-item">
            <span>🎟️</span>

            <div>
              <h3>{t("points.step2Title")}</h3>
              <p>{t("points.step2Description")}</p>
            </div>
          </div>

          <div className="points-info-item">
            <span>⭐</span>

            <div>
              <h3>{t("points.step3Title")}</h3>
              <p>{t("points.step3Description")}</p>
            </div>
          </div>
        </section>

        <section className="points-actions">
          <button
            className="points-redeem-btn"
            onClick={() => navigate("/canjes")}
          >
            {t("points.viewRewards")}
          </button>

          <button
            className="points-history-btn"
            onClick={() => navigate("/historial-canjes")}
          >
            {t("points.viewHistory")}
          </button>
        </section>
      </main>
    </div>
  );
}
