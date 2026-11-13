
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyRedemptions,
  type Redemption,
} from "../services/redemption.service";

import "../styles/historialCanjes.css";

// Exportación nombrada compatible con main.tsx
export function HistorialCanjes() {
  const navigate = useNavigate();

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // Consultar historial desde el backend
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyRedemptions();

      setRedemptions(data);
    } catch (err) {
      console.error("Error cargando historial:", err);

      setError("No fue posible cargar el historial de canjes.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar historial al abrir la pantalla
  // y cuando el usuario presione actualizar
  useEffect(() => {
    void loadHistory();
  }, [loadHistory, reload]);

  // Resumen de canjes
  const totalRedemptions = redemptions.length;

  const totalPoints = redemptions
    .filter((item) => item.status !== "cancelled")
    .reduce((total, item) => total + item.pointsSpent, 0);

  // Traducir estados
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";

      case "pending":
        return "Pendiente";

      case "cancelled":
        return "Cancelado";

      default:
        return "Desconocido";
    }
  };

  return (
    <div className="history-page">
      {/* Encabezado */}
      <header className="history-header">
        <button
          className="history-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Volver
        </button>

        <h1>Historial de canjes</h1>

        <p>
          Consulta las recompensas que has solicitado.
        </p>
      </header>

      <main className="history-container">
        {/* Resumen */}
        <section className="history-summary">
          <div>
            <span>Total de canjes</span>

            <h2>
              {loading || error ? "—" : totalRedemptions}
            </h2>
          </div>

          <div>
            <span>Puntos utilizados</span>

            <h2>
              {loading || error
                ? "—"
                : `${totalPoints.toLocaleString("es-MX")} pts`}
            </h2>
          </div>
        </section>

        {/* Acciones */}
        <div className="history-actions">
          <button
            onClick={() => navigate("/canjes")}
          >
            🎁 Ver recompensas
          </button>

          <button
            onClick={() => setReload((value) => value + 1)}
            disabled={loading}
          >
            ↻ Actualizar
          </button>
        </div>

        {/* Cargando */}
        {loading ? (
          <div className="history-state">
            <div className="history-state-icon">
              ⏳
            </div>

            <h2>Cargando historial...</h2>

            <p>Estamos consultando tus canjes.</p>
          </div>
        ) : error ? (
          /* Error */
          <div className="history-state">
            <div className="history-state-icon">
              ⚠️
            </div>

            <h2>No pudimos cargar tus canjes</h2>

            <p>{error}</p>

            <button
              className="history-retry-btn"
              onClick={() =>
                setReload((value) => value + 1)
              }
            >
              Intentar nuevamente
            </button>
          </div>
        ) : redemptions.length === 0 ? (
          /* Sin canjes */
          <div className="history-state">
            <div className="history-state-icon">
              🎁
            </div>

            <h2>Aún no tienes canjes</h2>

            <p>
              Explora las recompensas disponibles
              y utiliza tus puntos para conseguir
              beneficios.
            </p>

            <button
              className="history-retry-btn"
              onClick={() => navigate("/canjes")}
            >
              Explorar recompensas
            </button>
          </div>
        ) : (
          /* Historial de canjes */
          <section className="history-list">
            {redemptions.map((redemption) => (
              <article
                className="history-card"
                key={redemption._id}
              >
                {/* Imagen de recompensa */}
                {redemption.reward?.imageUrl ? (
                  <img
                    src={redemption.reward.imageUrl}
                    alt={
                      redemption.reward.name ||
                      "Recompensa"
                    }
                    className="history-image"
                  />
                ) : (
                  <div className="history-image-placeholder">
                    🍔
                  </div>
                )}

                {/* Información */}
                <div className="history-details">
                  <h3>
                    {redemption.reward?.name ||
                      "Recompensa no disponible"}
                  </h3>

                  <p>
                    {redemption.reward?.restaurantName ||
                      "Restaurante no disponible"}
                  </p>

                  <small>
                    Fecha:{" "}
                    {new Date(
                      redemption.createdAt
                    ).toLocaleDateString("es-MX")}
                  </small>
                </div>

                {/* Puntos y estado */}
                <div className="history-meta">
                  <strong>
                    -
                    {redemption.pointsSpent.toLocaleString(
                      "es-MX"
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

// Exportación por defecto compatible con otros componentes
export default HistorialCanjes;
