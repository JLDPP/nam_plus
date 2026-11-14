
/*
  ARCHIVO: historialCanjes.tsx

  FUNCIÓN:
  Consultar el historial de canjes del usuario.

  FUNCIONES CONSERVADAS:
  - Consulta al backend.
  - Botón actualizar.
  - Resumen de canjes.
  - Cálculo de puntos utilizados.
  - Estados completed, pending y cancelled.
  - Imágenes y datos de recompensas.
  - Navegación.
  - Exportaciones existentes.

  MEJORA:
  - Traducción español/inglés con i18next.
*/

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getMyRedemptions,
  type Redemption,
} from "../services/redemption.service";

import "../styles/historialCanjes.css";

// Exportación nombrada compatible con main.tsx
export function HistorialCanjes() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [redemptions, setRedemptions] =
    useState<Redemption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // ==========================================
  // CONSULTAR HISTORIAL
  // ==========================================

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyRedemptions();

      setRedemptions(data);
    } catch (err) {
      console.error(
        "Error cargando historial:",
        err
      );

      setError("history.loadError");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, reload]);

  // ==========================================
  // FORMATO DE IDIOMA
  // ==========================================

  const locale =
    i18n.resolvedLanguage?.startsWith("en")
      ? "en-US"
      : "es-MX";

  // ==========================================
  // RESUMEN DE CANJES
  // ==========================================

  const totalRedemptions = redemptions.length;

  const totalPoints = redemptions
    .filter((item) => item.status !== "cancelled")
    .reduce(
      (total, item) => total + item.pointsSpent,
      0
    );

  // ==========================================
  // TRADUCIR ESTADOS
  // ==========================================

  function getStatusText(status: string) {
    switch (status) {
      case "completed":
        return t("history.completed");

      case "pending":
        return t("history.pending");

      case "cancelled":
        return t("history.cancelled");

      default:
        return t("history.unknown");
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="history-page">

      {/* ENCABEZADO */}
      <header className="history-header">
        <button
          className="history-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← {t("common.back")}
        </button>

        <h1>{t("history.title")}</h1>

        <p>{t("history.subtitle")}</p>
      </header>

      <main className="history-container">

        {/* RESUMEN */}
        <section className="history-summary">
          <div>
            <span>{t("history.totalRedemptions")}</span>

            <h2>
              {loading || error
                ? "—"
                : totalRedemptions}
            </h2>
          </div>

          <div>
            <span>{t("history.pointsSpent")}</span>

            <h2>
              {loading || error
                ? "—"
                : `${totalPoints.toLocaleString(locale)} pts`}
            </h2>
          </div>
        </section>

        {/* ACCIONES */}
        <div className="history-actions">
          <button
            onClick={() => navigate("/canjes")}
          >
            🎁 {t("history.viewRewards")}
          </button>

          <button
            onClick={() =>
              setReload((value) => value + 1)
            }
            disabled={loading}
          >
            ↻ {t("history.refresh")}
          </button>
        </div>

        {/* CARGANDO */}
        {loading ? (
          <div className="history-state">
            <div className="history-state-icon">
              ⏳
            </div>

            <h2>{t("history.loading")}</h2>

            <p>{t("history.loadingDescription")}</p>
          </div>

        ) : error ? (
          /* ERROR */
          <div className="history-state">
            <div className="history-state-icon">
              ⚠️
            </div>

            <h2>{t("history.errorTitle")}</h2>

            <p>{t(error)}</p>

            <button
              className="history-retry-btn"
              onClick={() =>
                setReload((value) => value + 1)
              }
            >
              {t("history.retry")}
            </button>
          </div>

        ) : redemptions.length === 0 ? (
          /* SIN CANJES */
          <div className="history-state">
            <div className="history-state-icon">
              🎁
            </div>

            <h2>{t("history.emptyTitle")}</h2>

            <p>{t("history.emptyDescription")}</p>

            <button
              className="history-retry-btn"
              onClick={() => navigate("/canjes")}
            >
              {t("history.exploreRewards")}
            </button>
          </div>

        ) : (
          /* HISTORIAL DE CANJES */
          <section className="history-list">
            {redemptions.map((redemption) => (
              <article
                className="history-card"
                key={redemption._id}
              >

                {/* IMAGEN */}
                {redemption.reward?.imageUrl ? (
                  <img
                    src={redemption.reward.imageUrl}
                    alt={
                      redemption.reward.name ||
                      t("history.reward")
                    }
                    className="history-image"
                  />
                ) : (
                  <div className="history-image-placeholder">
                    🍔
                  </div>
                )}

                {/* INFORMACIÓN */}
                <div className="history-details">
                  <h3>
                    {redemption.reward?.name ||
                      t("history.rewardUnavailable")}
                  </h3>

                  <p>
                    {redemption.reward?.restaurantName ||
                      t("history.restaurantUnavailable")}
                  </p>

                  <small>
                    {t("history.date")}:{" "}
                    {new Date(
                      redemption.createdAt
                    ).toLocaleDateString(locale)}
                  </small>
                </div>

                {/* PUNTOS Y ESTADO */}
                <div className="history-meta">
                  <strong>
                    -
                    {redemption.pointsSpent.toLocaleString(
                      locale
                    )}{" "}
                    pts
                  </strong>

                  <span
                    className={`history-status status-${redemption.status}`}
                  >
                    {getStatusText(redemption.status)}
                  </span>
                </div>

              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

// Exportación por defecto compatible
export default HistorialCanjes;
