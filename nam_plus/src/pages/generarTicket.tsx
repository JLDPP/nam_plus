
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";

import { api } from "../api";
import "../styles/generarTicket.css";

interface Ticket {
  id: string;
  code: string;
  restaurantName: string;
  amountMXN: number;
  points: number;
  status: string;
  expiresAt: string;
}

interface TicketResponse {
  message: string;
  ticket: Ticket;
}

export default function GenerarTicket() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const userRole = (() => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "null"
      );
      return user?.role || "";
    } catch {
      return "";
    }
  })();

  const isAdmin = userRole === "admin";

  async function generateTicket(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const amountMXN = Number(amount);

    if (
      !Number.isFinite(amountMXN) ||
      amountMXN < 500 ||
      !Number.isInteger(Math.round(amountMXN * 100)) ||
      Math.abs(
        amountMXN * 100 - Math.round(amountMXN * 100)
      ) > 0.000001
    ) {
      setError(
        "Ingresa un importe válido de al menos $500 MXN, con máximo dos decimales."
      );
      return;
    }

    if (isAdmin && !restaurantId.trim()) {
      setError("Indica el ID del restaurante.");
      return;
    }

    // Evitar generar accidentalmente otro ticket
    // sin advertir que el código anterior se perderá.
    if (ticket) {
      const confirmed = window.confirm(
        "¿Generar otro ticket? Asegúrate de haber entregado o copiado el código anterior."
      );

      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const { data } = await api.post<TicketResponse>(
        "/api/tickets",
        {
          amountMXN,
          ...(isAdmin
            ? { restaurantId: restaurantId.trim() }
            : {}),
        }
      );

      setTicket(data.ticket);
      setMessage(data.message);
    } catch (err: unknown) {
      console.error("Error generando ticket:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "No fue posible generar el ticket."
        );
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!ticket) return;

    try {
      await navigator.clipboard.writeText(ticket.code);
      setMessage("Código copiado correctamente.");
    } catch {
      setError(
        "No fue posible copiar el código automáticamente."
      );
    }
  }

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <header className="ticket-header">
          <button
            type="button"
            className="ticket-back-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Volver
          </button>

          <h1>Generar tickets QR</h1>

          <p>
            Registra una compra y genera un código
            para que el cliente acumule puntos.
          </p>
        </header>

        <div className="ticket-content">
          <section className="ticket-form-card">
            <h2>Nueva compra</h2>

            <form onSubmit={generateTicket}>
              <label htmlFor="ticket-amount">
                Importe de compra (MXN)
              </label>

              <input
                id="ticket-amount"
                type="number"
                min="500"
                step="0.01"
                placeholder="Ej. 500"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                disabled={loading}
                required
              />

              {isAdmin && (
                <>
                  <label htmlFor="ticket-restaurant">
                    ID del restaurante
                  </label>

                  <input
                    id="ticket-restaurant"
                    type="text"
                    placeholder="ID de MongoDB del restaurante"
                    value={restaurantId}
                    onChange={(event) =>
                      setRestaurantId(event.target.value)
                    }
                    disabled={loading}
                    required
                  />
                </>
              )}

              <div className="ticket-points-preview">
                <span>Puntos para el cliente</span>

                <strong>
                  {Number(amount) >= 500
                    ? "100 puntos"
                    : "0 puntos"}
                </strong>
              </div>

              <button
                type="submit"
                className="ticket-generate-btn"
                disabled={loading}
              >
                {loading
                  ? "Generando..."
                  : "Generar ticket QR"}
              </button>
            </form>
          </section>

          {ticket && (
            <section className="ticket-result-card">
              <h2>Ticket generado</h2>

              <p className="ticket-restaurant-name">
                {ticket.restaurantName}
              </p>

              <div className="ticket-qr-box">
                <QRCodeSVG
                  value={ticket.code}
                  size={220}
                  level="M"
                  marginSize={1}
                />
              </div>

              <p className="ticket-code-label">
                Código manual del ticket
              </p>

              <div className="ticket-code-value">
                {ticket.code}
              </div>

              <button
                type="button"
                className="ticket-copy-btn"
                onClick={() => void copyCode()}
              >
                Copiar código
              </button>

              <div className="ticket-result-info">
                <p>
                  Importe:{" "}
                  <strong>
                    ${ticket.amountMXN.toFixed(2)} MXN
                  </strong>
                </p>

                <p>
                  Puntos:{" "}
                  <strong>
                    +{ticket.points}
                  </strong>
                </p>

                <p>
                  Válido hasta:{" "}
                  <strong>
                    {new Date(
                      ticket.expiresAt
                    ).toLocaleDateString("es-MX")}
                  </strong>
                </p>
              </div>

              <p className="ticket-note">
                Entrega el código o muestra el QR al cliente.
                Solo podrá utilizarse una vez.
              </p>
            </section>
          )}
        </div>

        {message && (
          <div className="ticket-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="ticket-error" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
