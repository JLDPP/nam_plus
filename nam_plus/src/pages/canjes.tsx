
/*
  ARCHIVO: canjes.tsx

  FUNCIÓN:
  Catálogo de recompensas de Ñam+.

  FUNCIONES CONSERVADAS:
  - Consulta de recompensas reales.
  - Consulta del saldo de puntos.
  - Validación de inventario.
  - Validación de puntos suficientes.
  - Prevención de canjes duplicados.
  - Confirmación antes del canje.
  - Actualización de puntos e inventario.
  - Manejo de errores.
  - Navegación.
  - Diseño original.

  MEJORA:
  - Traducción español/inglés con i18next.
*/

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";

import {
  getRewards,
  type Reward,
} from "../services/reward.service";

import {
  redeemReward,
} from "../services/redemption.service";

import {
  getPointsBalance,
} from "../services/points.service";

import "../styles/canjes.css";

export default function Canjes() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [redeemingId, setRedeemingId] =
    useState<string | null>(null);

  // Impide solicitudes repetidas durante un canje.
  const redeemingRef = useRef(false);

  // ==========================================
  // IDIOMA PARA FORMATO DE NÚMEROS
  // ==========================================

  const locale =
    i18n.resolvedLanguage?.startsWith("en")
      ? "en-US"
      : "es-MX";

  // ==========================================
  // CARGAR RECOMPENSAS Y PUNTOS
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        const [rewardsData, balance] = await Promise.all([
          getRewards(),
          getPointsBalance(),
        ]);

        if (!active) return;

        setRewards(
          rewardsData.filter((reward) => reward.active)
        );

        setPoints(balance);
      } catch (err) {
        console.error(
          "Error cargando catálogo:",
          err
        );

        if (active) {
          setError("rewards.loadError");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // ACTUALIZAR RECOMPENSAS Y SALDO
  // ==========================================

  async function refreshData() {
    const [rewardsResult, pointsResult] =
      await Promise.allSettled([
        getRewards(),
        getPointsBalance(),
      ]);

    let refreshed = true;

    if (rewardsResult.status === "fulfilled") {
      setRewards(
        rewardsResult.value.filter(
          (reward) => reward.active
        )
      );
    } else {
      refreshed = false;

      console.error(
        "Error actualizando recompensas:",
        rewardsResult.reason
      );
    }

    if (pointsResult.status === "fulfilled") {
      setPoints(pointsResult.value);
    } else {
      refreshed = false;
      setPoints(null);

      console.error(
        "Error actualizando puntos:",
        pointsResult.reason
      );
    }

    return refreshed;
  }

  // ==========================================
  // CANJEAR RECOMPENSA
  // ==========================================

  async function handleRedeem(reward: Reward) {
    if (redeemingRef.current || loading) return;

    if (points === null) {
      setError("rewards.balanceError");
      return;
    }

    if (reward.stock <= 0) {
      setError("rewards.outOfStockError");
      return;
    }

    if (points < reward.pointsCost) {
      setError("rewards.insufficientError");
      return;
    }

    const confirmed = window.confirm(
      t("rewards.confirmRedeem", {
        name: reward.name,
        points: reward.pointsCost.toLocaleString(locale),
      })
    );

    if (!confirmed) return;

    redeemingRef.current = true;
    setRedeemingId(reward._id);
    setError("");
    setMessage("");

    try {
      await redeemReward(reward._id);

      setMessage(
        t("rewards.redeemSuccess", {
          name: reward.name,
        })
      );

      const refreshed = await refreshData();

      if (!refreshed) {
        setError("rewards.refreshError");
      }
    } catch (err: unknown) {
      console.error("Error realizando canje:", err);

      if (axios.isAxiosError(err)) {
        const serverMessage =
          typeof err.response?.data?.message === "string"
            ? err.response.data.message
            : null;

        // Conserva los errores específicos del backend.
        setError(
          serverMessage || "rewards.redeemError"
        );
      } else {
        setError("rewards.unexpectedError");
      }

      // Recuperar el saldo y el inventario.
      await refreshData();
    } finally {
      redeemingRef.current = false;
      setRedeemingId(null);
    }
  }

  // ==========================================
  // MOSTRAR ERRORES TRADUCIDOS
  // ==========================================

  function displayError(value: string) {
    return value.startsWith("rewards.")
      ? t(value)
      : value;
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="redeem-page">
      <header className="redeem-header">
        <button
          className="redeem-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← {t("common.back")}
        </button>

        <h1>{t("rewards.title")}</h1>

        <p>{t("rewards.subtitle")}</p>
      </header>

      <main className="redeem-container">
        <div className="redeem-top-actions">
          <button onClick={() => navigate("/puntos")}>
            ⭐ {t("rewards.myPoints")}
          </button>

          <button
            onClick={() => navigate("/historial-canjes")}
          >
            📋 {t("rewards.history")}
          </button>
        </div>

        {/* SALDO DISPONIBLE */}
        <section className="redeem-balance-card">
          <h2>
            ⭐ {t("rewards.availablePoints")}
          </h2>

          <div className="redeem-balance-total">
            {loading || points === null
              ? t("rewards.unavailable")
              : `${points.toLocaleString(locale)} pts`}
          </div>

          <p>{t("rewards.instructions")}</p>
        </section>

        {/* MENSAJES */}
        {message && (
          <div
            className="redeem-success"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="redeem-error"
            role="alert"
          >
            {displayError(error)}
          </div>
        )}

        {/* CATÁLOGO */}
        {loading ? (
          <div className="redeem-empty">
            {t("rewards.loading")}
          </div>
        ) : rewards.length === 0 ? (
          <div className="redeem-empty">
            <span>🍽️</span>

            <h2>{t("rewards.emptyTitle")}</h2>

            <p>{t("rewards.emptyDescription")}</p>
          </div>
        ) : (
          <section className="reward-grid">
            {rewards.map((reward) => {
              const insufficientPoints =
                points === null ||
                points < reward.pointsCost;

              const outOfStock = reward.stock <= 0;

              return (
                <article
                  className="reward-card"
                  key={reward._id}
                >
                  {reward.imageUrl ? (
                    <img
                      src={reward.imageUrl}
                      alt={reward.name}
                      className="reward-image"
                    />
                  ) : (
                    <div className="reward-image-placeholder">
                      🍔
                    </div>
                  )}

                  <div className="reward-content">
                    <span className="reward-restaurant">
                      {reward.restaurantName}
                    </span>

                    <h2>{reward.name}</h2>

                    <p className="reward-description">
                      {reward.description ||
                        t("rewards.defaultDescription")}
                    </p>

                    <div className="reward-footer">
                      <span className="reward-cost">
                        ⭐{" "}
                        {reward.pointsCost.toLocaleString(
                          locale
                        )}{" "}
                        pts
                      </span>

                      <span className="reward-stock">
                        {outOfStock
                          ? t("rewards.outOfStock")
                          : t("rewards.availableStock", {
                              count: reward.stock,
                            })}
                      </span>
                    </div>

                    {!outOfStock && points !== null && (
                      <p
                        className={
                          insufficientPoints
                            ? "redeem-insufficient"
                            : "redeem-available"
                        }
                      >
                        {insufficientPoints
                          ? t("rewards.insufficientPoints")
                          : t("rewards.enoughPoints")}
                      </p>
                    )}

                    <button
                      className="reward-redeem-btn"
                      disabled={
                        outOfStock ||
                        insufficientPoints ||
                        redeemingId !== null
                      }
                      onClick={() => handleRedeem(reward)}
                    >
                      {redeemingId === reward._id
                        ? t("rewards.processing")
                        : outOfStock
                        ? t("rewards.outOfStock")
                        : points === null
                        ? t("rewards.balanceUnavailable")
                        : insufficientPoints
                        ? t("rewards.insufficientShort")
                        : t("rewards.redeemButton")}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
