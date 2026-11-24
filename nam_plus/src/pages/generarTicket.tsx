
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";

import { useTranslation } from "react-i18next";
import { submitPurchase, type IssuedCoupon } from "../services/offlineQueue";
import "../styles/generarTicket.css";

export default function GenerarTicket() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [amount, setAmount] = useState("");

  // Correo electrónico del cliente
  const [customerEmail, setCustomerEmail] = useState("");

  const [ticket, setTicket] = useState<IssuedCoupon["ticket"] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  // ==========================================
  // GENERAR TICKET Y ENVIARLO POR CORREO
  // ==========================================

  async function generateTicket(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const amountMXN = Number(amount);

    // Validar importe de compra
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

    // Validar correo electrónico
    const email = customerEmail.trim();

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError(
        "Ingresa un correo electrónico válido del cliente."
      );
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
      const result = await submitPurchase({ amountMXN, customerEmail: email });
      if (result.status === "pending") {
        setTicket(null);
        setAmount("");
        setCustomerEmail("");
        setMessage(t("offline.purchasePending"));
        return;
      }
      const data = result.data as IssuedCoupon;

      setTicket(data.ticket);

      // Confirmar estado del envío
      if (data.email?.sent) {
        setMessage(
          `Ticket generado y enviado correctamente a ${data.email.recipient}.`
        );
      } else {
        setError(
          "El ticket se generó correctamente, pero no fue posible enviar el correo. " +
          "Puedes entregar el QR o copiar el código manual que aparece en pantalla. " +
          "No generes otro ticket para la misma compra."
        );
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "No fue posible generar el ticket."
        );
      } else {
        setError(t("offline.saveError"));
      }
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // COPIAR CÓDIGO MANUAL
  // ==========================================

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
            Registra una compra y envía el código QR
            y el código manual al correo del cliente
            para que acumule puntos.
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

              {/* CORREO ELECTRÓNICO DEL CLIENTE */}

              <label htmlFor="ticket-customer-email">
                Correo electrónico del cliente
              </label>

              <input
                id="ticket-customer-email"
                type="email"
                placeholder="cliente@gmail.com"
                value={customerEmail}
                onChange={(event) =>
                  setCustomerEmail(event.target.value)
                }
                maxLength={254}
                disabled={loading}
                autoComplete="email"
                required
              />

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
                  ? "Generando y enviando..."
                  : "Generar y enviar ticket QR"}
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
                El código QR y el código manual
                corresponden al mismo ticket.
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
