import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { api } from "../../api";
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

type Props = {
  mode: "publicar" | "historial";
};

type CanjeDeCliente = {
  _id: string;
  customerName: string;
  createdAt: string;
  pointsSpent: number;
  status: "pending" | "completed" | "cancelled";
};

const estadosCanje = {
  pending: "Pendiente de entrega",
  completed: "Entregado",
  cancelled: "Cancelado",
};

type PromotionForm = {
  title: string;
  description: string;
  restaurantName: string | null;
  minAmount: string;
  points: string;
  pointsCost: string;
  startDate: string;
  endDate: string;
};

const emptyForm: PromotionForm = {
  title: "",
  description: "",
  restaurantName: null,
  minAmount: "0",
  points: "0",
  pointsCost: "300",
  startDate: "",
  endDate: "",
};

type StatusFilter = "Todas" | PromotionStatus;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "No fue posible realizar la operación.";
  }

  return "Ocurrió un error inesperado.";
}

function getStatus(promotion: Promotion): PromotionStatus {
  const now = new Date();

  if (!promotion.active) return "Inactiva";
  if (promotion.startDate && new Date(promotion.startDate) > now) return "Programada";
  if (promotion.endDate && new Date(promotion.endDate) < now) return "Vencida";

  return "Activa";
}

function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("es-MX") : "Sin fecha";
}

function ClientesDePromocion({ promotionId }: { promotionId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [canjes, setCanjes] = useState<CanjeDeCliente[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;

    const controller = new AbortController();

    async function consultar() {
      try {
        const { data } = await api.get<CanjeDeCliente[]>(
          `/api/redemptions/promotions/${promotionId}/customers`,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) setCanjes(data);
      } catch (error) {
        if (!controller.signal.aborted) setError(getErrorMessage(error));
      }
    }

    void consultar();
    return () => controller.abort();
  }, [abierto, promotionId]);

  function alternarClientes() {
    setCanjes(null);
    setError("");
    setAbierto(!abierto);
  }

  return (
    <div>
      <button
        type="button"
        className="promotion-edit-btn"
        aria-expanded={abierto}
        onClick={alternarClientes}
      >
        {abierto ? "Ocultar clientes" : "Ver clientes"}
      </button>

      {abierto && (
        <section aria-label="Clientes de la promoción">
          {error && <p role="alert">{error}</p>}
          {!error && canjes === null && <p role="status">Consultando clientes…</p>}
          {!error && canjes?.length === 0 && (
            <p>Aún no hay canjes registrados para esta promoción.</p>
          )}
          {!error && canjes && canjes.length > 0 && (
            <ul>
              {canjes.map((canje) => (
                <li key={canje._id}>
                  <strong>{canje.customerName}</strong>
                  <div>
                    {new Date(canje.createdAt).toLocaleString("es-MX")}
                    {" · "}{canje.pointsSpent} pts
                    {" · "}{estadosCanje[canje.status]}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default function RestaurantePromociones({ mode }: Props) {
  const [restaurants, setRestaurants] = useState<OwnedRestaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [form, setForm] = useState<PromotionForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("Todas");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const selectedRestaurant = restaurants.find(
    (restaurant) => restaurant._id === restaurantId
  );

  const restaurantName =
    form.restaurantName ?? selectedRestaurant?.name ?? "";

  const loadPromotions = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyPromotions(signal);
      if (signal?.aborted) return;

      setRestaurants(data.restaurants);
      setPromotions(data.promotions);

      setRestaurantId((current) => {
        const exists = data.restaurants.some((r) => r._id === current);
        return exists ? current : data.restaurants[0]?._id || "";
      });
    } catch (err) {
      if (!signal?.aborted) setError(getErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadPromotions(controller.signal);
    return () => controller.abort();
  }, [loadPromotions]);

  function changeField(field: keyof PromotionForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function clearImage() {
    setImage(null);
    if (imageInput.current) imageInput.current.value = "";
  }

  function clearForm() {
    clearImage();
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(promotion: Promotion) {
    clearImage();
    setEditingId(promotion._id);

    setForm({
      title: promotion.title,
      description: promotion.description || "",
      restaurantName: promotion.restaurantName,
      minAmount: String(promotion.minAmount),
      points: String(promotion.points),
      pointsCost: String(promotion.pointsCost ?? 300),
      startDate: toInputDate(promotion.startDate),
      endDate: toInputDate(promotion.endDate),
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processingRef.current) return;

    setError("");
    setMessage("");

    if (!selectedRestaurant) {
      setError("Selecciona un restaurante");
      return;
    }

    if (!form.title.trim() || !restaurantName.trim()) {
      setError("Ingresa el nombre de la promoción y el del restaurante");
      return;
    }

    const minAmount = Number(form.minAmount);
    const points = Number(form.points);
    const pointsCost = Number(form.pointsCost);

    if (!form.minAmount.trim() || !Number.isFinite(minAmount) || minAmount < 0) {
      setError("Ingresa una compra mínima válida");
      return;
    }

    if (!form.points.trim() || !Number.isSafeInteger(points) || points < 0) {
      setError("Los puntos por compra deben ser un número entero no negativo");
      return;
    }

    if (!form.pointsCost.trim() || !Number.isSafeInteger(pointsCost) || pointsCost < 1) {
      setError("El costo de canje debe ser un número entero mayor que cero");
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("Revisa las fechas de vigencia");
      return;
    }

    const payload: RestaurantPromotionData = {
      title: form.title.trim(),
      description: form.description.trim(),
      restaurantName: restaurantName.trim(),
      minAmount,
      points,
      pointsCost,
      active: editingId
        ? promotions.find((item) => item._id === editingId)?.active ?? true
        : true,
      startDate: form.startDate
        ? new Date(`${form.startDate}T00:00:00`).toISOString()
        : undefined,
      endDate: form.endDate
        ? new Date(`${form.endDate}T23:59:59.999`).toISOString()
        : null,
    };

    processingRef.current = true;
    setSaving(true);

    try {
      if (editingId) {
        const updated = await updateRestaurantPromotion(
          restaurantId, editingId, payload, image
        );

        setPromotions((current) =>
          current.map((item) => item._id === updated._id ? updated : item)
        );
        setMessage("Promoción actualizada correctamente.");
      } else {
        const created = await createRestaurantPromotion(restaurantId, payload, image);
        setPromotions((current) => [created, ...current]);
        setMessage("Promoción publicada correctamente.");
      }

      clearForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      processingRef.current = false;
      setSaving(false);
    }
  }

  async function togglePromotion(promotion: Promotion) {
    if (processingRef.current) return;

    const accion = promotion.active ? "desactivar" : "activar";
    if (!window.confirm(`¿Deseas ${accion} "${promotion.title}"?`)) return;

    setError("");
    setMessage("");
    processingRef.current = true;
    setSaving(true);

    try {
      const updated = await updateRestaurantPromotion(
        restaurantId, promotion._id, { active: !promotion.active }
      );

      setPromotions((current) =>
        current.map((item) => item._id === updated._id ? updated : item)
      );

      setMessage(
        updated.active
          ? "Promoción habilitada. Se respetarán sus fechas de vigencia."
          : "Promoción desactivada correctamente."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      processingRef.current = false;
      setSaving(false);
    }
  }

  const ownPromotions = promotions.filter(
    (promotion) => promotion.restaurant === restaurantId
  );

  const visiblePromotions = ownPromotions.filter(
    (promotion) => filter === "Todas" || getStatus(promotion) === filter
  );

  const showForm = mode === "publicar" || editingId !== null;

  return (
    <div className="promotions-page rp-promotions">
      <div className="promotions-container">
        <header className="promotions-header">
          <div>
            <h1>
              {mode === "publicar" ? "Publicar promoción" : "Historial de promociones"}
            </h1>
            <p>Administra las promociones de tu restaurante.</p>
          </div>
          <Link to="/restaurante" className="promotions-back-btn">
            ← Volver al panel
          </Link>
        </header>

        <nav className="rp-promo-tabs">
          <Link
            to="/restaurante/promociones"
            onClick={clearForm}
            className={mode === "publicar" ? "rp-promo-tab selected" : "rp-promo-tab"}
          >
            + Publicar promoción
          </Link>
          <Link
            to="/restaurante/promociones/historial"
            onClick={clearForm}
            className={mode === "historial" ? "rp-promo-tab selected" : "rp-promo-tab"}
          >
            Historial
          </Link>
        </nav>

        {error && <p className="promotions-error" role="alert">{error}</p>}
        {message && <p className="promotions-success" role="status">{message}</p>}

        {loading ? (
          <p className="promotions-message">Cargando información...</p>
        ) : !selectedRestaurant ? (
          <section className="promotion-form-card">
            <h2>
              {error ? "No se pudo cargar el restaurante" : "No tienes un restaurante asignado"}
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
            <section className="rp-promo-restaurant">
              <div>
                <span>Restaurante seleccionado</span>
                {showForm ? (
                  <input
                    aria-label="Nombre del restaurante para esta promoción"
                    value={restaurantName}
                    onChange={(e) => changeField("restaurantName", e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <h2>{selectedRestaurant.name}</h2>
                )}
              </div>

              {restaurants.length > 1 && (
                <select
                  aria-label="Seleccionar restaurante"
                  value={restaurantId}
                  disabled={saving}
                  onChange={(e) => {
                    setRestaurantId(e.target.value);
                    clearForm();
                    setFilter("Todas");
                    setMessage("");
                    setError("");
                  }}
                >
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              )}
            </section>

            {showForm && (
              <section className="promotion-form-card">
                <h2>{editingId ? "Editar promoción" : "Nueva promoción"}</h2>

                <form className="promotion-form" onSubmit={handleSubmit}>
                  <div className="promotion-form-group">
                    <label htmlFor="promo-title">Nombre de la promoción</label>
                    <input
                      id="promo-title"
                      value={form.title}
                      placeholder="Ej. Hamburguesas al 2x1"
                      onChange={(e) => changeField("title", e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-restaurant">Restaurante</label>
                    <input
                      id="promo-restaurant"
                      value={restaurantName}
                      onChange={(e) => changeField("restaurantName", e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group promotion-form-full">
                    <label htmlFor="promo-image">
                      Imagen de la promoción (JPG, PNG o WebP, máximo 5 MB)
                    </label>
                    <input
                      id="promo-image"
                      ref={imageInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group promotion-form-full">
                    <label htmlFor="promo-description">Descripción</label>
                    <textarea
                      id="promo-description"
                      rows={4}
                      value={form.description}
                      placeholder="Describe los beneficios y condiciones..."
                      onChange={(e) => changeField("description", e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-amount">Compra mínima (MXN)</label>
                    <input
                      id="promo-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minAmount}
                      onChange={(e) => changeField("minAmount", e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-points">Puntos que gana el cliente por compra</label>
                    <input
                      id="promo-points"
                      type="number"
                      min="0"
                      step="1"
                      value={form.points}
                      onChange={(e) => changeField("points", e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-cost">Costo de canje (puntos)</label>
                    <input
                      id="promo-cost"
                      type="number"
                      min="1"
                      step="1"
                      value={form.pointsCost}
                      onChange={(e) => changeField("pointsCost", e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-start">Fecha de inicio</label>
                    <input
                      id="promo-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => changeField("startDate", e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-group">
                    <label htmlFor="promo-end">Fecha límite</label>
                    <input
                      id="promo-end"
                      type="date"
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={(e) => changeField("endDate", e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="promotion-form-actions">
                    <button type="submit" className="promotion-submit-btn" disabled={saving}>
                      {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Publicar promoción"}
                    </button>
                    <button
                      type="button"
                      className="promotion-cancel-btn"
                      onClick={clearForm}
                      disabled={saving}
                    >
                      {editingId ? "Cancelar edición" : "Limpiar formulario"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {mode === "historial" && (
              <>
                <section className="rp-promo-stats">
                  <article>
                    <span>Total de promociones</span>
                    <strong>{ownPromotions.length}</strong>
                  </article>
                  <article>
                    <span>Activas</span>
                    <strong>{ownPromotions.filter((p) => getStatus(p) === "Activa").length}</strong>
                  </article>
                  <article>
                    <span>Vencidas</span>
                    <strong>{ownPromotions.filter((p) => getStatus(p) === "Vencida").length}</strong>
                  </article>
                  <article>
                    <span>Inactivas</span>
                    <strong>{ownPromotions.filter((p) => getStatus(p) === "Inactiva").length}</strong>
                  </article>
                </section>

                <div className="rp-promo-toolbar">
                  <h2 className="promotions-list-title">Mis promociones</h2>
                  <select
                    aria-label="Filtrar por estado"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as StatusFilter)}
                  >
                    <option value="Todas">Todos los estados</option>
                    <option value="Activa">Activas</option>
                    <option value="Programada">Programadas</option>
                    <option value="Vencida">Vencidas</option>
                    <option value="Inactiva">Inactivas</option>
                  </select>

                  <button
                    type="button"
                    className="promotions-back-btn"
                    disabled={saving}
                    onClick={() => void loadPromotions()}
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
                    const status = getStatus(promotion);

                    return (
                      <article key={promotion._id} className="promotion-card">
                        {promotion.imageUrl && (
                          <img
                            src={promotion.imageUrl}
                            alt={promotion.title}
                            className="promotion-image"
                            loading="lazy"
                          />
                        )}

                        <div className="promotion-card-header">
                          <span className={`rp-promo-status status-${status.toLowerCase()}`}>
                            {status}
                          </span>
                          <span className="promotion-points">+{promotion.points} pts</span>
                        </div>

                        <h2>{promotion.title}</h2>
                        <h3>{promotion.restaurantName}</h3>
                        <p>{promotion.description || "Sin descripción"}</p>

                        <div className="promotion-condition">
                          Compra mínima: ${promotion.minAmount.toLocaleString("es-MX")} MXN
                        </div>
                        <div className="promotion-condition">
                          Costo de canje: {promotion.pointsCost != null
                            ? `${promotion.pointsCost} pts`
                            : "Sin configurar"}
                        </div>
                        <div className="promotion-condition">
                          Publicada: {formatDate(promotion.createdAt)}
                        </div>
                        <div className="promotion-condition">
                          Inicio: {formatDate(promotion.startDate)}
                        </div>
                        <div className="promotion-condition">
                          Vencimiento: {promotion.endDate ? formatDate(promotion.endDate) : "Sin vencimiento"}
                        </div>

                        <div className="promotion-admin-actions">
                          <button
                            type="button"
                            className="promotion-edit-btn"
                            disabled={saving}
                            onClick={() => handleEdit(promotion)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={promotion.active ? "promotion-disable-btn" : "promotion-enable-btn"}
                            disabled={saving || editingId === promotion._id}
                            onClick={() => void togglePromotion(promotion)}
                          >
                            {promotion.active ? "Desactivar" : "Activar"}
                          </button>
                        </div>

                        <ClientesDePromocion promotionId={promotion._id} />
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