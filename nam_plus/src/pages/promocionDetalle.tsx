import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { isAxiosError } from "axios";

import { api } from "../api";
import {
  getPromotionById,
  type Promotion,
} from "../services/promotion.service";

import "../styles/promocionDetalle.css";

type PromocionConCanje = Promotion & {
  pointsCost?: number | null;
  stock?: number | null;
};

type RespuestaCanje = {
  pointsBalance: number;
  redemption: {
    pointsSpent: number;
  };
};

type Recibo = {
  puntosUsados: number;
  saldoFinal: number;
};

function formatearPuntos(valor: number) {
  return valor.toLocaleString("es-MX");
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha definida";

  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function goBack() {
  window.location.href = "/dashboard";
}

export default function PromocionDetalle() {
  const { id } = useParams();

  return <DetalleDePromocion key={id} id={id} />;
}

function DetalleDePromocion({ id }: { id?: string }) {
  const [promotion, setPromotion] = useState<PromocionConCanje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saldo, setSaldo] = useState<number | null>(null);
  const [canjeando, setCanjeando] = useState(false);
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [mensajeCanje, setMensajeCanje] = useState("");
  const [resultadoIncierto, setResultadoIncierto] = useState(false);

  const envioEnCurso = useRef(false);
  const saldoConfirmadoPorCanje = useRef(false);

  useEffect(() => {
    let vigente = true;

    async function cargarPromocion() {
      if (!id) {
        setError("No se encontró la promoción.");
        setLoading(false);
        return;
      }

      try {
        const data = await getPromotionById(id);
        if (vigente) setPromotion(data);
      } catch (error) {
        console.error("Error cargando promoción:", error);
        if (vigente) setError("No se pudo cargar la promoción.");
      } finally {
        if (vigente) setLoading(false);
      }
    }

    async function cargarSaldo() {
      try {
        const { data } = await api.get<{
          pointsBalance?: number;
          balance?: number;
        }>("/api/points/balance");

        const disponible = data.pointsBalance ?? data.balance;

        // Conserva el saldo del canje si la consulta inicial llega después.
        if (
          vigente &&
          !saldoConfirmadoPorCanje.current &&
          typeof disponible === "number" &&
          Number.isFinite(disponible)
        ) {
          setSaldo(disponible);
        }
      } catch (error) {
        console.error("Error consultando saldo:", error);
      }
    }

    void cargarPromocion();
    if (id) void cargarSaldo();

    return () => {
      vigente = false;
    };
  }, [id]);

  const costo = promotion?.pointsCost;
  const stock = promotion?.stock;

  const tieneCosto =
    typeof costo === "number" && Number.isSafeInteger(costo) && costo > 0;

  const hayExistencias =
    typeof stock === "number" && Number.isSafeInteger(stock) && stock > 0;

  async function canjearPuntos() {
    if (
      !id ||
      !promotion?.active ||
      !tieneCosto ||
      !hayExistencias ||
      envioEnCurso.current ||
      recibo ||
      resultadoIncierto
    ) {
      return;
    }

    envioEnCurso.current = true;
    setCanjeando(true);
    setMensajeCanje("");

    try {
      const { data } = await api.post<RespuestaCanje>("/api/redemptions", {
        promotionId: id,
        expectedPointsCost: costo,
      });

      const usados = data?.redemption?.pointsSpent;
      const nuevoSaldo = data?.pointsBalance;

      if (
        !Number.isSafeInteger(usados) ||
        usados <= 0 ||
        !Number.isSafeInteger(nuevoSaldo) ||
        nuevoSaldo < 0
      ) {
        throw new Error("El servidor devolvió un recibo incompleto.");
      }

      saldoConfirmadoPorCanje.current = true;
      setSaldo(nuevoSaldo);
      setRecibo({ puntosUsados: usados, saldoFinal: nuevoSaldo });
      setMostrarAviso(true);
    } catch (error) {
      const respuesta = isAxiosError<{ message?: string }>(error)
        ? error.response
        : undefined;

      if (respuesta && respuesta.status >= 400 && respuesta.status < 500) {
        setMensajeCanje(
          respuesta.data?.message || "No se pudo realizar el canje."
        );
      } else {
        // Si se perdió la respuesta, el canje podría estar registrado.
        setResultadoIncierto(true);
        setMensajeCanje(
          "No pudimos confirmar el resultado. Revisa tu historial de canjes."
        );
      }
    } finally {
      envioEnCurso.current = false;
      setCanjeando(false);
    }
  }

  if (loading) {
    return (
      <div className="promotion-detail-page">
        <p className="promotion-detail-message">Cargando promoción...</p>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="promotion-detail-page">
        <div className="promotion-detail-error">
          <p>{error || "Promoción no encontrada."}</p>
          <button className="promotion-detail-back-btn" onClick={goBack}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  let textoBoton = "Canjear puntos";
  if (tieneCosto) textoBoton = `Canjear ${formatearPuntos(costo)} puntos`;
  if (canjeando) textoBoton = "Canjeando…";
  if (recibo) textoBoton = "✓ Canjeado";

  let avisoInferior = mensajeCanje;

  if (!avisoInferior && promotion.active && !recibo) {
    if (!tieneCosto) {
      avisoInferior = "Esta promoción todavía no tiene un costo de canje configurado.";
    } else if (!hayExistencias) {
      avisoInferior = "Esta promoción está agotada.";
    }
  }

  return (
    <div className="promotion-detail-page">
      <div className="promotion-detail-container">
        <div className="nam-canje-barra">
          <button className="promotion-detail-back-btn" onClick={goBack}>
            ← Volver
          </button>

          {saldo !== null && (
            <div className="nam-canje-saldo">
              <span aria-hidden="true">★</span>
              Mis puntos: {formatearPuntos(saldo)} pts
            </div>
          )}
        </div>

        <div className="promotion-detail-card">
          {promotion.imageUrl && (
            <div className="promotion-detail-image-container">
              <img
                src={promotion.imageUrl}
                alt={promotion.title}
                className="promotion-detail-image"
              />
            </div>
          )}

          <div className="promotion-detail-content">
            <span className="promotion-detail-badge">Promoción</span>
            <h1>{promotion.title}</h1>
            <h2>{promotion.restaurantName}</h2>

            {promotion.description && (
              <p className="promotion-detail-description">
                {promotion.description}
              </p>
            )}

            <div className="promotion-detail-info-grid">
              <div className="promotion-detail-info">
                <span>Compra mínima</span>
                <strong>${promotion.minAmount}</strong>
              </div>

              <div className="promotion-detail-info">
                <span>Puntos</span>
                <strong>+{promotion.points} pts</strong>
              </div>

              <div className="promotion-detail-info">
                <span>Inicio</span>
                <strong>{formatDate(promotion.startDate)}</strong>
              </div>

              <div className="promotion-detail-info">
                <span>Vigencia</span>
                <strong>
                  {promotion.endDate
                    ? formatDate(promotion.endDate)
                    : "Sin fecha límite"}
                </strong>
              </div>
            </div>

            <div className="promotion-detail-status">
              <span className={promotion.active ? "status-active" : "status-inactive"}>
                {promotion.active ? "Promoción activa" : "Promoción no disponible"}
              </span>
            </div>

            <div className="promotion-detail-actions">
              <button
                type="button"
                className="promotion-detail-secondary-btn"
                onClick={goBack}
              >
                Volver
              </button>

              {promotion.active && (
                <button
                  type="button"
                  className={
                    recibo
                      ? "promotion-detail-secondary-btn nam-canje-completado"
                      : "promotion-detail-secondary-btn"
                  }
                  onClick={canjearPuntos}
                  disabled={
                    canjeando ||
                    !!recibo ||
                    resultadoIncierto ||
                    !tieneCosto ||
                    !hayExistencias
                  }
                >
                  {textoBoton}
                </button>
              )}
            </div>

            {avisoInferior && (
              <p role="status" className="promotion-detail-feedback">
                {avisoInferior}
              </p>
            )}
          </div>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {mostrarAviso && recibo && (
          <aside className="nam-canje-aviso" aria-label="Confirmación del canje">
            <span className="nam-canje-check" aria-hidden="true">✓</span>

            <div className="nam-canje-aviso-texto">
              <strong>¡Canje exitoso!</strong>
              <p>Se canjearon {formatearPuntos(recibo.puntosUsados)} puntos de tu cuenta.</p>
              <p>Tu nuevo saldo es <b>{formatearPuntos(recibo.saldoFinal)} pts.</b></p>
            </div>

            <button
              type="button"
              className="nam-canje-cerrar"
              aria-label="Cerrar aviso de canje"
              onClick={() => setMostrarAviso(false)}
            >
              ×
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}