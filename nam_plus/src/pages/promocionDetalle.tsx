/*
  ARCHIVO: promocionDetalle.tsx

  FUNCIÓN:
  Muestra la información completa de una promoción seleccionada.

  CARACTERÍSTICAS:
  - Obtiene el ID de la promoción desde la URL.
  - Consulta la promoción en el backend.
  - Muestra imagen, restaurante, descripción, compra mínima,
    puntos y vigencia.
  - Permite regresar al dashboard.
  - Permite ir al canje de ticket.
*/

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getPromotionById,
  type Promotion,
} from "../services/promotion.service";

import "../styles/promocionDetalle.css";

export default function PromocionDetalle() {
  const { id } = useParams();

  const [promotion, setPromotion] =
    useState<Promotion | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadPromotion() {
      if (!id) {
        setError("No se encontró la promoción.");
        setLoading(false);
        return;
      }

      try {
        const data =
          await getPromotionById(id);

        setPromotion(data);
      } catch (error) {
        console.error(
          "Error cargando promoción:",
          error
        );

        setError(
          "No se pudo cargar la promoción."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPromotion();
  }, [id]);

  function goBack() {
    window.location.href =
      "/dashboard";
  }

  function goToRedeem() {
    window.location.href =
      "/codigo";
  }

  function formatDate(
    date?: string | null
  ) {
    if (!date) {
      return "Sin fecha definida";
    }

    return new Date(
      date
    ).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="promotion-detail-page">
        <p className="promotion-detail-message">
          Cargando promoción...
        </p>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="promotion-detail-page">
        <div className="promotion-detail-error">
          <p>
            {error ||
              "Promoción no encontrada."}
          </p>

          <button
            onClick={goBack}
            className="promotion-detail-back-btn"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="promotion-detail-page">
      <div className="promotion-detail-container">

        <button
          className="promotion-detail-back-btn"
          onClick={goBack}
        >
          ← Volver
        </button>

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

            <span className="promotion-detail-badge">
              Promoción
            </span>

            <h1>
              {promotion.title}
            </h1>

            <h2>
              {promotion.restaurantName}
            </h2>

            {promotion.description && (
              <p className="promotion-detail-description">
                {promotion.description}
              </p>
            )}

            <div className="promotion-detail-info-grid">

              <div className="promotion-detail-info">
                <span>
                  Compra mínima
                </span>

                <strong>
                  ${promotion.minAmount}
                </strong>
              </div>

              <div className="promotion-detail-info">
                <span>
                  Puntos
                </span>

                <strong>
                  +{promotion.points} pts
                </strong>
              </div>

              <div className="promotion-detail-info">
                <span>
                  Inicio
                </span>

                <strong>
                  {formatDate(
                    promotion.startDate
                  )}
                </strong>
              </div>

              <div className="promotion-detail-info">
                <span>
                  Vigencia
                </span>

                <strong>
                  {promotion.endDate
                    ? formatDate(
                        promotion.endDate
                      )
                    : "Sin fecha límite"}
                </strong>
              </div>

            </div>

            <div className="promotion-detail-status">
              <span
                className={
                  promotion.active
                    ? "status-active"
                    : "status-inactive"
                }
              >
                {promotion.active
                  ? "Promoción activa"
                  : "Promoción no disponible"}
              </span>
            </div>

            <div className="promotion-detail-actions">

              <button
                className="promotion-detail-secondary-btn"
                onClick={goBack}
              >
                Volver
              </button>

              {promotion.active && (
                <button
                  className="promotion-detail-primary-btn"
                  onClick={goToRedeem}
                >
                  Canjear ticket
                </button>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}