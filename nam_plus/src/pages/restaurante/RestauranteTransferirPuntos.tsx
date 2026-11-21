import { useState, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  findCustomer,
  transferPoints,
  type Customer,
  type TransferPointsResponse,
} from "../../services/points.service";

import logo from "../../assets/logo.jpeg";

import "./restaurante-puntos.css";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "No se pudo completar la operación."
    );
  }

  return "Ocurrió un error inesperado.";
}

export default function RestauranteTransferirPuntos() {
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState("");

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [result, setResult] =
    useState<TransferPointsResponse | null>(null);

  const [searching, setSearching] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState("");

  const busy = useRef(false);

  // BUSCAR CLIENTE
  async function handleSearch(event: FormEvent) {
    event.preventDefault();

    if (busy.current) return;

    setError("");
    setCustomer(null);
    setResult(null);
    setPoints("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    busy.current = true;
    setSearching(true);

    try {
      const data = await findCustomer(normalizedEmail);

      setCustomer(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSearching(false);
      busy.current = false;
    }
  }

  // TRANSFERIR PUNTOS
  async function handleTransfer(event: FormEvent) {
    event.preventDefault();

    if (!customer || busy.current) return;

    setError("");

    const amount = Number(points);

    if (
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > 10000
    ) {
      setError("Ingresa entre 1 y 10000 puntos.");
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas otorgar ${amount} puntos a ${customer.name}?`
    );

    if (!confirmed) return;

    busy.current = true;
    setTransferring(true);

    try {
      const data = await transferPoints(
        customer._id,
        amount
      );

      setResult(data);
      setCustomer(null);
      setPoints("");
      setEmail("");
    } catch (err) {
      setError(
        getErrorMessage(err) +
          " Verifica el historial antes de reintentar."
      );
    } finally {
      setTransferring(false);
      busy.current = false;
    }
  }

  // LIMPIAR FORMULARIO
  function handleReset() {
    if (busy.current) return;

    setEmail("");
    setPoints("");
    setCustomer(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="rtp-page">
      <main className="rtp-container">

        {/* ENCABEZADO */}

        <header className="rtp-header">
          <div className="rtp-brand">
            <img src={logo} alt="Ñam+" />

            <div>
              <h2>Ñam+</h2>
              <span>Portal de restaurantes</span>
            </div>
          </div>

          <Link
            to="/restaurante"
            className="rtp-back"
          >
            ← Volver al panel
          </Link>
        </header>

        {/* TÍTULO */}

        <section className="rtp-heading">
          <span className="rtp-eyebrow">
            ADMINISTRACIÓN DE PUNTOS
          </span>

          <h1>Transferir puntos</h1>

          <p>
            Recompensa a tus clientes por las compras
            realizadas en tu restaurante.
          </p>
        </section>

        {/* ERRORES */}

        {error && (
          <div className="rtp-error" role="alert">
            {error}
          </div>
        )}

        {/* BUSCAR CLIENTE */}

        <section className="rtp-card">
          <div className="rtp-card-header">
            <div className="rtp-icon">1</div>

            <div>
              <h2>Buscar cliente</h2>
              <p>
                Ingresa el correo registrado en Ñam+.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <label htmlFor="customer-email">
              Correo electrónico
            </label>

            <div className="rtp-search">
              <input
                id="customer-email"
                type="email"
                placeholder="cliente@correo.com"
                value={email}
                required
                disabled={searching || transferring}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setCustomer(null);
                  setResult(null);
                  setPoints("");
                  setError("");
                }}
              />

              <button
                type="submit"
                className="rtp-primary"
                disabled={searching || transferring}
              >
                {searching
                  ? "Buscando..."
                  : "Buscar cliente"}
              </button>
            </div>
          </form>
        </section>

        {/* CLIENTE ENCONTRADO */}

        {customer && (
          <section className="rtp-card">
            <div className="rtp-card-header">
              <div className="rtp-icon">2</div>

              <div>
                <h2>Otorgar puntos</h2>
                <p>
                  Verifica la información del cliente.
                </p>
              </div>
            </div>

            <div className="rtp-customer">
              <div className="rtp-avatar">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{customer.name}</strong>
                <span>{customer.email}</span>
              </div>

              <span className="rtp-verified">
                ✓ Cliente encontrado
              </span>
            </div>

            <form onSubmit={handleTransfer}>
              <label htmlFor="transfer-points">
                Cantidad de puntos
              </label>

              <input
                id="transfer-points"
                type="number"
                min="1"
                max="10000"
                step="1"
                placeholder="Ejemplo: 100"
                value={points}
                required
                disabled={transferring}
                onChange={(event) =>
                  setPoints(event.target.value)
                }
              />

              <div className="rtp-info">
                Los puntos se agregarán directamente
                al saldo del cliente.
              </div>

              <div className="rtp-actions">
                <button
                  type="submit"
                  className="rtp-primary"
                  disabled={transferring}
                >
                  {transferring
                    ? "Transfiriendo..."
                    : "Confirmar transferencia"}
                </button>

                <button
                  type="button"
                  className="rtp-secondary"
                  disabled={transferring}
                  onClick={handleReset}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        {/* RESULTADO */}

        {result && (
          <section
            className="rtp-card rtp-result"
            role="status"
          >
            <div className="rtp-result-icon">✓</div>

            <h2>¡Transferencia realizada!</h2>

            <p>
              Los puntos se agregaron correctamente.
            </p>

            <div className="rtp-result-details">
              <div>
                <span>Cliente</span>
                <strong>{result.customer.name}</strong>
              </div>

              <div>
                <span>Puntos transferidos</span>
                <strong>
                  +{result.pointsTransferred} pts
                </strong>
              </div>

              <div>
                <span>Nuevo saldo</span>
                <strong>
                  {result.customer.pointsBalance} pts
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="rtp-primary"
              onClick={handleReset}
            >
              Realizar otra transferencia
            </button>
          </section>
        )}

        <footer className="rtp-footer">
          Ñam+ · Portal de restaurantes
        </footer>

      </main>
    </div>
  );
}