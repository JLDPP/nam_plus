
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Bloquea solicitudes repetidas mientras se realiza un canje.
  const redeemingRef = useRef(false);

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

        setRewards(rewardsData.filter((reward) => reward.active));
        setPoints(balance);
      } catch (err) {
        console.error("Error cargando catálogo:", err);

        if (active) {
          setError("No fue posible cargar las recompensas o tus puntos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  async function refreshData() {
    const [rewardsResult, pointsResult] = await Promise.allSettled([
      getRewards(),
      getPointsBalance(),
    ]);

    let refreshed = true;

    if (rewardsResult.status === "fulfilled") {
      setRewards(
        rewardsResult.value.filter((reward) => reward.active)
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

  async function handleRedeem(reward: Reward) {
    if (redeemingRef.current || loading) return;

    if (points === null) {
      setError("No se pudo verificar tu saldo de puntos.");
      return;
    }

    if (reward.stock <= 0) {
      setError("Esta recompensa está agotada.");
      return;
    }

    if (points < reward.pointsCost) {
      setError("No tienes suficientes puntos para este canje.");
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas canjear "${reward.name}" por ${reward.pointsCost} puntos?`
    );

    if (!confirmed) return;

    redeemingRef.current = true;
    setRedeemingId(reward._id);
    setError("");
    setMessage("");

    try {
      await redeemReward(reward._id);

      setMessage(
        `¡Canje registrado correctamente! Has solicitado: ${reward.name}. Puedes consultar su estado en tu historial.`
      );

      const refreshed = await refreshData();

      if (!refreshed) {
        setError(
          "El canje se registró, pero no se pudo actualizar toda la información. Recarga la página para consultar tu saldo."
        );
      }
    } catch (err: unknown) {
      console.error("Error realizando canje:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          "No fue posible realizar el canje."
        );
      } else {
        setError("Ocurrió un error inesperado al realizar el canje.");
      }

      // Recuperar datos por si el saldo o el inventario cambió.
      await refreshData();
    } finally {
      redeemingRef.current = false;
      setRedeemingId(null);
    }
  }

  return (
    <div className="redeem-page">
      <header className="redeem-header">
        <button
          className="redeem-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Volver
        </button>

        <h1>Catálogo de recompensas</h1>

        <p>
          Utiliza tus puntos y disfruta de tus alimentos favoritos.
        </p>
      </header>

      <main className="redeem-container">
        <div className="redeem-top-actions">
          <button onClick={() => navigate("/puntos")}>
            ⭐ Mis puntos
          </button>

          <button onClick={() => navigate("/historial-canjes")}>
            📋 Historial de canjes
          </button>
        </div>

        {/* Saldo disponible */}
        <section className="redeem-balance-card">
          <h2>⭐ Tus puntos disponibles</h2>

          <div className="redeem-balance-total">
            {loading || points === null
              ? "No disponible"
              : `${points.toLocaleString("es-MX")} pts`}
          </div>

          <p>
            Selecciona una recompensa que puedas obtener
            con tus puntos acumulados.
          </p>
        </section>

        {message && (
          <div className="redeem-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="redeem-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="redeem-empty">
            Cargando recompensas...
          </div>
        ) : rewards.length === 0 ? (
          <div className="redeem-empty">
            <span>🍽️</span>
            <h2>No hay recompensas disponibles</h2>
            <p>
              Pronto encontrarás nuevos alimentos para canjear.
            </p>
          </div>
        ) : (
          <section className="reward-grid">
            {rewards.map((reward) => {
              const insufficientPoints =
                points === null || points < reward.pointsCost;

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
                        "Disfruta esta recompensa."}
                    </p>

                    <div className="reward-footer">
                      <span className="reward-cost">
                        ⭐{" "}
                        {reward.pointsCost.toLocaleString("es-MX")} pts
                      </span>

                      <span className="reward-stock">
                        {outOfStock
                          ? "Agotado"
                          : `${reward.stock} disponibles`}
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
                          ? "No tienes suficientes puntos"
                          : "Puntos suficientes para canjear"}
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
                        ? "Procesando..."
                        : outOfStock
                        ? "Agotado"
                        : points === null
                        ? "Saldo no disponible"
                        : insufficientPoints
                        ? "Puntos insuficientes"
                        : "Canjear recompensa"}
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
