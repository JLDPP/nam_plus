
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  getMyPromotions,
  createRestaurantPromotion,
  updateRestaurantPromotion,
  type Promotion,
  type PromotionStatus,
  type OwnedRestaurant,
  type RestaurantPromotionData,
} from "../../services/promotion.service";

import "../../styles/promociones.css";
import "./restaurante-promociones.css";

// ==========================================
// TIPOS Y FORMULARIO
// ==========================================

type Props = {
  mode: "publicar" | "historial";
};

type PromotionForm = {
  title: string;
  description: string;
  imageUrl: string;
  minAmount: string;
  points: string;
  startDate: string;
  endDate: string;
};

const emptyForm: PromotionForm = {
  title: "",
  description: "",
  imageUrl: "",
  minAmount: "0",
  points: "0",
  startDate: "",
  endDate: "",
};

type StatusFilter = "Todas" | PromotionStatus;

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "No fue posible realizar la operación."
    );
  }

  return "Ocurrió un error inesperado.";
}

function getStatus(
  promotion: Promotion
): PromotionStatus {
  const now = new Date();

  if (!promotion.active) {
    return "Inactiva";
  }

  if (
    promotion.startDate &&
    new Date(promotion.startDate) > now
  ) {
    return "Programada";
  }

  if (
    promotion.endDate &&
    new Date(promotion.endDate) < now
  ) {
    return "Vencida";
  }

  return "Activa";
}

// Convertir una fecha guardada a formato del input.
function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleDateString(
    "es-MX"
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function RestaurantePromociones({
  mode,
}: Props) {
  const [restaurants, setRestaurants] =
    useState<OwnedRestaurant[]>([]);

  const [restaurantId, setRestaurantId] =
    useState("");

  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [form, setForm] =
    useState<PromotionForm>({
      ...emptyForm,
    });

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<StatusFilter>("Todas");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const processingRef = useRef(false);

  // Restaurante actualmente seleccionado.
  const selectedRestaurant = restaurants.find(
    (restaurant) =>
      restaurant._id === restaurantId
  );

  // ==========================================
  // CARGAR RESTAURANTES Y PROMOCIONES
  // ==========================================

  const loadPromotions = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const data = await getMyPromotions(signal);

        if (signal?.aborted) return;

        setRestaurants(data.restaurants);
        setPromotions(data.promotions);

        setRestaurantId((current) => {
          const exists = data.restaurants.some(
            (restaurant) =>
              restaurant._id === current
          );

          return exists
            ? current
            : data.restaurants[0]?._id || "";
        });
      } catch (err: unknown) {
        if (signal?.aborted) return;

        setError(getErrorMessage(err));
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadPromotions(controller.signal);

    return () => controller.abort();
  }, [loadPromotions]);

  // ==========================================
  // FORMULARIO
  // ==========================================

  function changeField(
    field: keyof PromotionForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(promotion: Promotion) {
    setEditingId(promotion._id);

    setForm({
      title: promotion.title,
      description: promotion.description || "",
      imageUrl: promotion.imageUrl || "",
      minAmount: String(promotion.minAmount),
      points: String(promotion.points),
      startDate: toInputDate(
        promotion.startDate
      ),
      endDate: toInputDate(
        promotion.endDate
      ),
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // PUBLICAR O ACTUALIZAR
  // ==========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (processingRef.current) return;

    setError("");
    setMessage("");

    if (!selectedRestaurant) {
      setError("Selecciona un restaurante");
      return;
    }

    if (!form.title.trim()) {
      setError("Ingresa el nombre de la promoción");
      return;
    }

    const minAmount = Number(form.minAmount);
    const points = Number(form.points);

    if (
      !form.minAmount.trim() ||
      !Number.isFinite(minAmount) ||
      minAmount < 0
    ) {
      setError("Ingresa una compra mínima válida");
      return;
    }

    if (
      !form.points.trim() ||
      !Number.isSafeInteger(points) ||
      points < 0
    ) {
      setError(
        "Los puntos deben ser un número entero no negativo"
      );
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setError("Revisa las fechas de vigencia");
      return;
    }

    // La fecha límite incluye todo el día seleccionado
    // según la zona horaria del navegador.
    const payload: RestaurantPromotionData = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      minAmount,
      points,

      active: editingId
        ? promotions.find(
            (promotion) =>
              promotion._id === editingId
          )?.active ?? true
        : true,

      startDate: form.startDate
        ? new Date(
            `${form.startDate}T00:00:00`
          ).toISOString()
        : undefined,

      endDate: form.endDate
        ? new Date(
            `${form.endDate}T23:59:59.999`
          ).toISOString()
        : null,
    };

    processingRef.current = true;
    setSaving(true);

    try {
      if (editingId) {
        const updated =
          await updateRestaurantPromotion(
            restaurantId,
            editingId,
            payload
          );

        setPromotions((current) =>
          current.map((promotion) =>
            promotion._id === updated._id
              ? updated
              : promotion
          )
        );

        setMessage(
          "Promoción actualizada correctamente."
        );
      } else {
        const created =
          await createRestaurantPromotion(
            restaurantId,
            payload
          );

        setPromotions((current) => [
          created,
          ...current,
        ]);

        setMessage(
          "Promoción publicada correctamente."
        );
      }

      clearForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      processingRef.current = false;
      setSaving(false);
    }
  }

  // ==========================================
  // ACTIVAR O DESACTIVAR
  // ==========================================

  async function togglePromotion(
    promotion: Promotion
  ) {
    if (processingRef.current) return;

    const action = promotion.active
      ? "desactivar"
      : "activar";

    if (
      !window.confirm(
        `¿Deseas ${action} "${promotion.title}"?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    processingRef.current = true;
    setSaving(true);

    try {
      const updated =
        await updateRestaurantPromotion(
          restaurantId,
          promotion._id,
          {
            active: !promotion.active,
          }
        );

      setPromotions((current) =>
        current.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );

      setMessage(
        updated.active
          ? "Promoción habilitada. Se respetarán sus fechas de vigencia."
          : "Promoción desactivada correctamente."
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      processingRef.current = false;
      setSaving(false);
    }
  }

  // ==========================================
  // FILTROS Y ESTADÍSTICAS
  // ==========================================

  const ownPromotions = promotions.filter(
    (promotion) =>
      promotion.restaurant === restaurantId
  );

  const visiblePromotions = ownPromotions.filter(
    (promotion) =>
      filter === "Todas" ||
      getStatus(promotion) === filter
  );

  const activeCount = ownPromotions.filter(
    (promotion) =>
      getStatus(promotion) === "Activa"
  ).length;

  const expiredCount = ownPromotions.filter(
    (promotion) =>
      getStatus(promotion) === "Vencida"
  ).length;

  const inactiveCount = ownPromotions.filter(
    (promotion) =>
      getStatus(promotion) === "Inactiva"
  ).length;

  const showForm =
    mode === "publicar" || editingId !== null;

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="promotions-page rp-promotions">
      <div className="promotions-container">

        {/* ENCABEZADO */}
        <header className="promotions-header">
          <div>
            <h1>
              {mode === "publicar"
                ? "Publicar promoción"
                : "Historial de promociones"}
            </h1>

            <p>
              Administra las promociones
              de tu restaurante.
            </p>
          </div>

          <Link
            to="/restaurante"
            className="promotions-back-btn"
          >
            ← Volver al panel
          </Link>
        </header>

        {/* MENÚ */}
        <nav className="rp-promo-tabs">
          <Link
            to="/restaurante/promociones"
            onClick={clearForm}
            className={
              mode === "publicar"
                ? "rp-promo-tab selected"
                : "rp-promo-tab"
            }
          >
            + Publicar promoción
          </Link>

          <Link
            to="/restaurante/promociones/historial"
            onClick={clearForm}
            className={
              mode === "historial"
                ? "rp-promo-tab selected"
                : "rp-promo-tab"
            }
          >
            Historial
          </Link>
        </nav>

        {/* MENSAJES */}
        {error && (
          <p
            className="promotions-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            className="promotions-success"
            role="status"
          >
            {message}
          </p>
        )}

        {loading ? (
          <p className="promotions-message">
            Cargando información...
          </p>
        ) : !selectedRestaurant ? (
          <section className="promotion-form-card">
            <h2>
              {error
                ? "No se pudo cargar el restaurante"
                : "No tienes un restaurante asignado"}
            </h2>

            <p className="promotions-message">
              {error
                ? "Intenta actualizar la información."
                : "Solicita al administrador que vincule tu cuenta a un restaurante activo."}
            </p>

            <button
              type="button"
              className="promotion-submit-btn"
              onClick={() => void loadPromotions()}
            >
              Actualizar
            </button>
          </section>
        ) : (
          <>
            {/* SELECCIONAR RESTAURANTE */}
            <section className="rp-promo-restaurant">
              <div>
                <span>Restaurante seleccionado</span>

                <h2>{selectedRestaurant.name}</h2>
              </div>

              {restaurants.length > 1 && (
                <select
                  aria-label="Seleccionar restaurante"
                  value={restaurantId}
                  disabled={saving}
                  onChange={(event) => {
                    setRestaurantId(
                      event.target.value
                    );

                    clearForm();
                    setFilter("Todas");
                    setMessage("");
                    setError("");
                  }}
                >
                  {restaurants.map(
                    (restaurant) => (
                      <option
                        key={restaurant._id}
                        value={restaurant._id}
                      >
                        {restaurant.name}
                      </option>
                    )
                  )}
                </select>
              )}
            </section>

            {/* FORMULARIO */}
            {showForm && (
              <section className="promotion-form-card">
                <h2>
                  {editingId
                    ? "Editar promoción"
                    : "Nueva promoción"}
                </h2>

                <form
                  className="promotion-form"
                  onSubmit={handleSubmit}
                >
                  <div className="promotion-form-group">
                    <label htmlFor="promo-title">
                      Nombre de la promoción
                    </label>

                    <input
                      id="promo-title"
                      value={form.title}
                      placeholder="Ej. Hamburguesas al 2x1"
                      onChange={(e) =>
                        changeField(
                          "title",
                          e.target.value
                        )
                      }
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label>
                      Restaurante
                    </label>

                    <input
                      aria-label="Restaurante propietario"
                      value={selectedRestaurant.name}
                      readOnly
                    />
                  </div>

                  <div className="promotion-form-group promotion-form-full">
                    <label htmlFor="promo-image">
                      URL de la imagen
                    </label>

                    <input
                      id="promo-image"
                      type="url"
                      value={form.imageUrl}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      onChange={(e) =>
                        changeField(
                          "imageUrl",
                          e.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group promotion-form-full">
                    <label htmlFor="promo-description">
                      Descripción
                    </label>

                    <textarea
                      id="promo-description"
                      rows={4}
                      value={form.description}
                      placeholder="Describe los beneficios y condiciones..."
                      onChange={(e) =>
                        changeField(
                          "description",
                          e.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-amount">
                      Compra mínima (MXN)
                    </label>

                    <input
                      id="promo-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minAmount}
                      onChange={(e) =>
                        changeField(
                          "minAmount",
                          e.target.value
                        )
                      }
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-points">
                      Puntos otorgados
                    </label>

                    <input
                      id="promo-points"
                      type="number"
                      min="0"
                      step="1"
                      value={form.points}
                      onChange={(e) =>
                        changeField(
                          "points",
                          e.target.value
                        )
                      }
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-start">
                      Fecha de inicio
                    </label>

                    <input
                      id="promo-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        changeField(
                          "startDate",
                          e.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-end">
                      Fecha límite
                    </label>

                    <input
                      id="promo-end"
                      type="date"
                      min={
                        form.startDate ||
                        undefined
                      }
                      value={form.endDate}
                      onChange={(e) =>
                        changeField(
                          "endDate",
                          e.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-actions">
                    <button
                      type="submit"
                      className="promotion-submit-btn"
                      disabled={saving}
                    >
                      {saving
                        ? "Guardando..."
                        : editingId
                        ? "Guardar cambios"
                        : "Publicar promoción"}
                    </button>

                    <button
                      type="button"
                      className="promotion-cancel-btn"
                      onClick={clearForm}
                      disabled={saving}
                    >
                      {editingId
                        ? "Cancelar edición"
                        : "Limpiar formulario"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* HISTORIAL */}
            {mode === "historial" && (
              <>
                <section className="rp-promo-stats">
                  <article>
                    <span>Total de promociones</span>
                    <strong>
                      {ownPromotions.length}
                    </strong>
                  </article>

                  <article>
                    <span>Activas</span>
                    <strong>{activeCount}</strong>
                  </article>

                  <article>
                    <span>Vencidas</span>
                    <strong>{expiredCount}</strong>
                  </article>

                  <article>
                    <span>Inactivas</span>
                    <strong>{inactiveCount}</strong>
                  </article>
                </section>

                <div className="rp-promo-toolbar">
                  <h2 className="promotions-list-title">
                    Mis promociones
                  </h2>

                  <select
                    aria-label="Filtrar por estado"
                    value={filter}
                    onChange={(e) =>
                      setFilter(
                        e.target.value as StatusFilter
                      )
                    }
                  >
                    <option value="Todas">
                      Todos los estados
                    </option>

                    <option value="Activa">
                      Activas
                    </option>

                    <option value="Programada">
                      Programadas
                    </option>

                    <option value="Vencida">
                      Vencidas
                    </option>

                    <option value="Inactiva">
                      Inactivas
                    </option>
                  </select>

                  <button
                    type="button"
                    className="promotions-back-btn"
                    disabled={saving}
                    onClick={() =>
                      void loadPromotions()
                    }
                  >
                    ↻ Actualizar
                  </button>
                </div>

                {visiblePromotions.length === 0 && (
                  <section className="promotion-form-card">
                    <p className="promotions-message">
                      No hay promociones con este estado.
                    </p>
                  </section>
                )}

                <div className="promotions-grid">
                  {visiblePromotions.map((promotion) => {
                    const status =
                      getStatus(promotion);

                    return (
                      <article
                        key={promotion._id}
                        className="promotion-card"
                      >
                        {promotion.imageUrl && (
                          <img
                            src={promotion.imageUrl}
                            alt={promotion.title}
                            className="promotion-image"
                            loading="lazy"
                          />
                        )}

                        <div className="promotion-card-header">
                          <span
                            className={
                              `rp-promo-status status-${status.toLowerCase()}`
                            }
                          >
                            {status}
                          </span>

                          <span className="promotion-points">
                            +{promotion.points} pts
                          </span>
                        </div>

                        <h2>{promotion.title}</h2>

                        <h3>
                          {promotion.restaurantName}
                        </h3>

                        <p>
                          {promotion.description ||
                            "Sin descripción"}
                        </p>

                        <div className="promotion-condition">
                          Compra mínima: $
                          {promotion.minAmount.toLocaleString(
                            "es-MX"
                          )} MXN
                        </div>

                        <div className="promotion-condition">
                          Publicada:{" "}
                          {formatDate(
                            promotion.createdAt
                          )}
                        </div>

                        <div className="promotion-condition">
                          Inicio:{" "}
                          {formatDate(
                            promotion.startDate
                          )}
                        </div>

                        <div className="promotion-condition">
                          Vencimiento:{" "}
                          {promotion.endDate
                            ? formatDate(
                                promotion.endDate
                              )
                            : "Sin vencimiento"}
                        </div>

                        <div className="promotion-admin-actions">
                          <button
                            type="button"
                            className="promotion-edit-btn"
                            disabled={saving}
                            onClick={() =>
                              handleEdit(promotion)
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={
                              promotion.active
                                ? "promotion-disable-btn"
                                : "promotion-enable-btn"
                            }
                            disabled={
                              saving ||
                              editingId === promotion._id
                            }
                            onClick={() =>
                              void togglePromotion(
                                promotion
                              )
                            }
                          >
                            {promotion.active
                              ? "Desactivar"
                              : "Activar"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
