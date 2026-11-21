import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getPromotions,
  type Promotion,
} from "../services/promotion.service";

import { getPointsBalance } from "../services/points.service";

import "../styles/canjes.css";

export default function Canjes() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const english = i18n.resolvedLanguage?.startsWith("en") ?? false;
  const locale = english ? "en-US" : "es-MX";

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPromotions() {
      try {
        const data = await getPromotions();

        if (mounted) {
          setPromotions(data.filter((promotion) => promotion.active));
        }
      } catch (error) {
        console.error("Error cargando promociones:", error);

        if (mounted) {
          setLoadError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function loadBalance() {
      try {
        const balance = await getPointsBalance();

        if (mounted) {
          setPoints(balance);
        }
      } catch (error) {
        console.error("Error cargando el saldo:", error);
      }
    }

    void loadPromotions();
    void loadBalance();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="redeem-page">
      <header className="redeem-header">
        <button
          type="button"
          className="redeem-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← {t("common.back")}
        </button>

        <h1>
          {english ? "Promotion catalog" : "Catálogo de promociones"}
        </h1>

        <p>
          {english
            ? "Explore promotions from participating restaurants."
            : "Explora las promociones de los restaurantes participantes."}
        </p>
      </header>

      <main className="redeem-container">
        <div className="redeem-top-actions">
          <button type="button" onClick={() => navigate("/puntos")}>
            ⭐ {t("rewards.myPoints")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/historial-canjes")}
          >
            📋 {t("rewards.history")}
          </button>
        </div>

        <section className="redeem-balance-card">
          <h2>⭐ {t("rewards.availablePoints")}</h2>

          <div className="redeem-balance-total">
            {points === null
              ? t("rewards.unavailable")
              : `${points.toLocaleString(locale)} pts`}
          </div>
        </section>

        {loading ? (
          <div className="redeem-empty" role="status">
            {english ? "Loading promotions..." : "Cargando promociones..."}
          </div>
        ) : loadError ? (
          <p className="redeem-error" role="alert">
            {english
              ? "Could not load promotions."
              : "No se pudieron cargar las promociones."}
          </p>
        ) : promotions.length === 0 ? (
          <div className="redeem-empty">
            <h2>
              {english ? "No active promotions" : "No hay promociones activas"}
            </h2>
          </div>
        ) : (
          <section className="reward-grid">
            {promotions.map((promotion) => (
              <article className="reward-card" key={promotion._id}>
                {promotion.imageUrl ? (
                  <img
                    className="reward-image"
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="reward-image-placeholder" aria-hidden="true">
                    🍽️
                  </div>
                )}

                <div className="reward-content">
                  <span className="reward-restaurant">
                    {promotion.restaurantName}
                  </span>

                  <h2>{promotion.title}</h2>

                  {promotion.description && (
                    <p className="reward-description">
                      {promotion.description}
                    </p>
                  )}

                  <div className="reward-footer">
                    <span className="reward-cost">
                      ⭐ +{promotion.points.toLocaleString(locale)} pts
                    </span>

                    <span className="reward-stock">
                      {english ? "Minimum purchase" : "Compra mínima"} ·{" "}
                      {promotion.minAmount.toLocaleString(locale, {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="reward-redeem-btn"
                    onClick={() => navigate(`/promociones/${promotion._id}`)}
                  >
                    {english ? "View promotion" : "Ver promoción"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}