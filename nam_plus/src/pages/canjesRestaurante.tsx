
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { api } from "../api";
import "../styles/canjesRestaurante.css";

interface RestaurantRedemption {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  reward: {
    _id: string;
    name: string;
    restaurantName: string;
    imageUrl?: string;
  } | null;
  pointsSpent: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

export default function CanjesRestaurante() {
  const navigate = useNavigate();

  const [redemptions, setRedemptions] = useState<
    RestaurantRedemption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  const [processingAction, setProcessingAction] = useState<
    "complete" | "cancel" | null
  >(null);

  // Evita solicitudes duplicadas por clics rápidos.
  const processingRef = useRef(false);

  // ==========================================
  // CONSULTAR CANJES DEL RESTAURANTE
  // ==========================================
  async function loadRedemptions() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get<RestaurantRedemption[]>(
        "/api/redemptions/restaurant"
      );

      setRedemptions(data);
    } catch (err) {
      console.error("Error cargando canjes:", err);
      setError("No fue posible cargar los canjes del restaurante.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRedemptions();
  }, []);

  // ==========================================
  // CONFIRMAR ENTREGA
  // ==========================================
  async function confirmDelivery(id: string) {
    if (processingRef.current) return;

    const confirmed = window.confirm(
      "¿Confirmas que entregaste esta recompensa al cliente?"
    );

    if (!confirmed) return;

    processingRef.current = true;
    setProcessingId(id);
    setProcessingAction("complete");
    setError("");
    setMessage("");

    try {
      await api.patch(`/api/redemptions/${id}/complete`);

      setMessage("Entrega confirmada correctamente.");

      await loadRedemptions();
    } catch (err: unknown) {
      console.error("Error confirmando entrega:", err);

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "No fue posible confirmar la entrega."
          : "Ocurrió un error inesperado."
      );
    } finally {
      processingRef.current = false;
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  // ==========================================
  // CANCELAR CANJE Y DEVOLVER PUNTOS
  // ==========================================
  async function cancelRedemption(id: string) {
    if (processingRef.current) return;

    const confirmed = window.confirm(
      "¿Seguro que deseas cancelar este canje?\n\n" +
        "Los puntos serán devueltos al cliente y el inventario será restaurado."
    );

    if (!confirmed) return;

    processingRef.current = true;
    setProcessingId(id);
    setProcessingAction("cancel");
    setError("");
    setMessage("");

    try {
      const { data } = await api.patch(
        `/api/redemptions/${id}/cancel`
      );

      setMessage(
        data.message ||
          "Canje cancelado y puntos devueltos correctamente."
      );

      await loadRedemptions();
    } catch (err: unknown) {
      console.error("Error cancelando canje:", err);

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "No fue posible cancelar el canje."
          : "Ocurrió un error inesperado."
      );
    } finally {
      processingRef.current = false;
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  // ==========================================
  // CONTADORES
  // ==========================================
  const pendingCount = redemptions.filter(
    (item) => item.status === "pending"
  ).length;

  const completedCount = redemptions.filter(
    (item) => item.status === "completed"
  ).length;

  const cancelledCount = redemptions.filter(
    (item) => item.status === "cancelled"
  ).length;

  return (
    <div className="restaurant-redemptions-page">
      <header className="restaurant-redemptions-header">
        <button onClick={() => navigate("/dashboard")}>
          ← Volver
        </button>

        <h1>Administración de canjes</h1>
        <p>
          Consulta, confirma o cancela los canjes de tus clientes.
        </p>
      </header>

      <main className="restaurant-redemptions-container">
        {/* Resumen */}
        <section className="restaurant-redemptions-summary">
          <div>
            <span>Canjes pendientes</span>
            <h2>{loading || error ? "—" : pendingCount}</h2>
          </div>

          <div>
            <span>Canjes completados</span>
            <h2>{loading || error ? "—" : completedCount}</h2>
          </div>

          <div>
            <span>Canjes cancelados</span>
            <h2>{loading || error ? "—" : cancelledCount}</h2>
          </div>
        </section>

        {/* Actualizar */}
        <button
          className="restaurant-refresh-btn"
          onClick={() => void loadRedemptions()}
          disabled={loading || processingId !== null}
        >
          ↻ Actualizar canjes
        </button>

        {message && (
          <div className="restaurant-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="restaurant-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="restaurant-empty">
            Cargando canjes...
          </div>
        ) : error ? (
          <div className="restaurant-empty">
            No se pudieron consultar los canjes.
          </div>
        ) : redemptions.length === 0 ? (
          <div className="restaurant-empty">
            <h2>No hay canjes registrados</h2>
            <p>
              Las solicitudes de tus clientes aparecerán aquí.
            </p>
          </div>
        ) : (
          <section className="restaurant-redemptions-list">
            {redemptions.map((redemption) => (
              <article
                className="restaurant-redemption-card"
                key={redemption._id}
              >
                <div className="restaurant-redemption-info">
                  <h2>
                    {redemption.reward?.name ||
                      "Recompensa no disponible"}
                  </h2>

                  <p>
                    Restaurante:{" "}
                    {redemption.reward?.restaurantName || "N/D"}
                  </p>

                  <p>
                    Cliente:{" "}
                    {redemption.user?.name || "No disponible"}
                  </p>

                  <p>
                    Fecha:{" "}
                    {new Date(
                      redemption.createdAt
                    ).toLocaleString("es-MX")}
                  </p>

                  <strong>
                    ⭐{" "}
                    {redemption.pointsSpent.toLocaleString("es-MX")}{" "}
                    puntos
                  </strong>
                </div>

                <div className="restaurant-redemption-actions">
                  <span
                    className={`restaurant-redemption-status status-${redemption.status}`}
                  >
                    {redemption.status === "pending"
                      ? "Pendiente"
                      : redemption.status === "completed"
                      ? "Completado"
                      : "Cancelado"}
                  </span>

                  {redemption.status === "pending" && (
                    <div className="restaurant-action-buttons">
                      <button
                        className="restaurant-confirm-btn"
                        disabled={processingId !== null}
                        onClick={() =>
                          void confirmDelivery(redemption._id)
                        }
                      >
                        {processingId === redemption._id &&
                        processingAction === "complete"
                          ? "Confirmando..."
                          : "Confirmar entrega"}
                      </button>

                      <button
                        className="restaurant-cancel-btn"
                        disabled={processingId !== null}
                        onClick={() =>
                          void cancelRedemption(redemption._id)
                        }
                      >
                        {processingId === redemption._id &&
                        processingAction === "cancel"
                          ? "Cancelando..."
                          : "Cancelar canje"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
