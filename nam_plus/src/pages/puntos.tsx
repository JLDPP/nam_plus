
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/puntos.css";

import { getPointsBalance } from "../services/points.service.ts";

export default function Puntos() {
  const navigate = useNavigate();

  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPoints() {
      try {
        setLoading(true);
        setError("");

        const balance = await getPointsBalance();

        setPoints(balance);
      } catch (err) {
        console.error("Error consultando puntos:", err);
        setError("No fue posible cargar tus puntos.");
      } finally {
        setLoading(false);
      }
    }

    loadPoints();
  }, []);

  return (
    <div className="points-page">
      <header className="points-header">
        <button
          className="points-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Volver
        </button>

        <h1>Mis puntos</h1>

        <p>Ñam+ Rewards</p>
      </header>

      <main className="points-container">
        <section className="points-balance-card">
          <span className="points-icon">⭐</span>

          <h2>Tu saldo disponible</h2>

          {loading ? (
            <p className="points-loading">
              Cargando puntos...
            </p>
          ) : (
            <div className="points-total">
              {points.toLocaleString("es-MX")}
              <span> pts</span>
            </div>
          )}

          {error && (
            <p className="points-error">
              {error}
            </p>
          )}

          <p>
            Sigue disfrutando de tus comidas favoritas
            y acumula puntos para conseguir recompensas.
          </p>
        </section>

        <section className="points-info-card">
          <h2>¿Cómo acumular puntos?</h2>

          <div className="points-info-item">
            <span>🛒</span>

            <div>
              <h3>Realiza una compra</h3>
              <p>
                Compra en los restaurantes participantes.
              </p>
            </div>
          </div>

          <div className="points-info-item">
            <span>🎟️</span>

            <div>
              <h3>Registra tu compra</h3>
              <p>
                Utiliza el código o QR de tu ticket
                para reclamar tus puntos.
              </p>
            </div>
          </div>

          <div className="points-info-item">
            <span>⭐</span>

            <div>
              <h3>Acumula puntos</h3>
              <p>
                Tus puntos se agregarán a tu cuenta
                cuando la compra sea validada.
              </p>
            </div>
          </div>
        </section>

        <section className="points-actions">
          <button
            className="points-redeem-btn"
            onClick={() => navigate("/canjes")}
          >
            Ver recompensas
          </button>

          <button
            className="points-history-btn"
            onClick={() => navigate("/historial-canjes")}
          >
            Ver historial de canjes
          </button>
        </section>
      </main>
    </div>
  );
}
