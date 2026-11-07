
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getRewards,
  type Reward,
} from "../services/reward.service.ts";

import {
  redeemReward,
} from "../services/redemption.service.ts";

import "../styles/canjes.css";

export default function Canjes() {
  const navigate = useNavigate();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  async function loadRewards() {
    try {
      setLoading(true);
      setError("");

      const data = await getRewards();

      setRewards(data.filter((reward) => reward.active));
    } catch (err) {
      console.error("Error cargando recompensas:", err);
      setError("No fue posible cargar las recompensas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(reward: Reward) {
    const confirmed = window.confirm(
      `¿Deseas canjear "${reward.name}" por ${reward.pointsCost} puntos?`
    );

    if (!confirmed) return;

    try {
      setRedeemingId(reward._id);
      setError("");
      setMessage("");

      await redeemReward(reward._id);

      setMessage(
        `¡Canje realizado! Has solicitado: ${reward.name}.`
      );

      await loadRewards();
    } catch (err: any) {
      console.error("Error realizando canje:", err);

      setError(
        err.response?.data?.message ||
        "No fue posible realizar el canje. Verifica tus puntos disponibles."
      );
    } finally {
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
          <button
            onClick={() => navigate("/puntos")}
          >
            ⭐ Mis puntos
          </button>

          <button
            onClick={() => navigate("/historial-canjes")}
          >
            📋 Historial de canjes
          </button>
        </div>

        {message && (
          <div className="redeem-success">
            {message}
          </div>
        )}

        {error && (
          <div className="redeem-error">
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
            {rewards.map((reward) => (
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
                    {reward.description || "Disfruta esta recompensa."}
                  </p>

                  <div className="reward-footer">
                    <span className="reward-cost">
                      ⭐ {reward.pointsCost.toLocaleString("es-MX")} pts
                    </span>

                    <span className="reward-stock">
                      {reward.stock > 0
                        ? `${reward.stock} disponibles`
                        : "Agotado"}
                    </span>
                  </div>

                  <button
                    className="reward-redeem-btn"
                    disabled={
                      reward.stock <= 0 ||
                      redeemingId !== null
                    }
                    onClick={() => handleRedeem(reward)}
                  >
                    {redeemingId === reward._id
                      ? "Procesando..."
                      : reward.stock <= 0
                      ? "Agotado"
                      : "Canjear recompensa"}
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
