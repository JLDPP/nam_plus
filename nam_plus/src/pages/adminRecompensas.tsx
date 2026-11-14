
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { api } from "../api";
import "../styles/adminRecompensas.css";

// ==========================================
// INTERFACES
// ==========================================

interface Reward {
  _id: string;
  name: string;
  description: string;
  restaurantName: string;
  restaurant?: {
    _id: string;
    name: string;
    active: boolean;
  } | null;
  imageUrl: string;
  pointsCost: number;
  stock: number;
  active: boolean;
}

interface RewardForm {
  name: string;
  description: string;
  imageUrl: string;
  pointsCost: string;
  stock: string;
  active: boolean;
  restaurantId: string;
}

const emptyForm: RewardForm = {
  name: "",
  description: "",
  imageUrl: "",
  pointsCost: "",
  stock: "0",
  active: true,
  restaurantId: "",
};

// ==========================================
// MANEJO DE ERRORES
// ==========================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    if (serverMessage) {
      return serverMessage;
    }

    if (status === 401) {
      return "Tu sesión expiró. Inicia sesión nuevamente.";
    }

    if (status === 403) {
      return "No tienes permisos para administrar recompensas.";
    }

    if (status === 404) {
      return "No se encontró la ruta de administración en el servidor.";
    }

    if (status === 500) {
      return "El servidor presentó un error interno.";
    }

    if (!error.response) {
      return "No fue posible conectar con el servidor.";
    }
  }

  return "Ocurrió un error inesperado.";
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function AdminRecompensas() {
  const navigate = useNavigate();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [processingId, setProcessingId] = useState<
    string | null
  >(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<
    string | null
  >(null);

  const [form, setForm] = useState<RewardForm>({
    ...emptyForm,
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Evita solicitudes duplicadas por doble clic.
  const savingRef = useRef(false);
  const processingRef = useRef(false);

  // ==========================================
  // CONSULTAR ROL LOCAL
  // ==========================================

  const userRole = (() => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      return typeof user?.role === "string"
        ? user.role
        : "";
    } catch {
      return "";
    }
  })();

  const isAdmin = userRole === "admin";

  // ==========================================
  // CONSULTAR RECOMPENSAS
  // ==========================================

  async function loadRewards() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get<Reward[]>(
        "/api/rewards/manage"
      );

      if (!Array.isArray(data)) {
        throw new Error(
          "El servidor no devolvió una lista de recompensas."
        );
      }

      setRewards(data);
    } catch (err: unknown) {
      console.error(
        "Error consultando recompensas:",
        err
      );

      if (axios.isAxiosError(err)) {
        setError(getErrorMessage(err));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No fue posible cargar las recompensas.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRewards();
  }, []);

  // ==========================================
  // FORMULARIO: CREAR RECOMPENSA
  // ==========================================

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  // ==========================================
  // FORMULARIO: EDITAR RECOMPENSA
  // ==========================================

  function openEdit(reward: Reward) {
    setEditingId(reward._id);

    setForm({
      name: reward.name,
      description: reward.description || "",
      imageUrl: reward.imageUrl || "",
      pointsCost: String(reward.pointsCost),
      stock: String(reward.stock),
      active: reward.active,
      restaurantId: reward.restaurant?._id || "",
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  // ==========================================
  // CERRAR FORMULARIO
  // ==========================================

  function closeForm() {
    if (savingRef.current) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  }

  // ==========================================
  // GUARDAR RECOMPENSA
  // ==========================================

  async function saveReward(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (savingRef.current) return;

    setError("");
    setMessage("");

    const name = form.name.trim();
    const pointsCost = Number(form.pointsCost);
    const stock = Number(form.stock);

    if (!name) {
      setError("Escribe el nombre de la recompensa.");
      return;
    }

    if (
      !form.pointsCost.trim() ||
      !Number.isSafeInteger(pointsCost) ||
      pointsCost < 1
    ) {
      setError(
        "El costo debe ser un número entero mayor a cero."
      );
      return;
    }

    if (
      !form.stock.trim() ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setError(
        "El inventario debe ser un número entero no negativo."
      );
      return;
    }

    if (
      !editingId &&
      isAdmin &&
      !form.restaurantId.trim()
    ) {
      setError("Indica el ID del restaurante.");
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      pointsCost,
      stock,
      active: form.active,
    };

    savingRef.current = true;
    setSaving(true);

    try {
      let successMessage = "";

      if (editingId) {
        await api.patch(
          `/api/rewards/manage/${editingId}`,
          payload
        );

        successMessage =
          "Recompensa actualizada correctamente.";
      } else {
        await api.post("/api/rewards/manage", {
          ...payload,
          ...(isAdmin
            ? {
                restaurantId:
                  form.restaurantId.trim(),
              }
            : {}),
        });

        successMessage =
          "Recompensa creada correctamente.";
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadRewards();
      setMessage(successMessage);
    } catch (err: unknown) {
      console.error(
        "Error guardando recompensa:",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  // ==========================================
  // ACTIVAR O DESACTIVAR RECOMPENSA
  // ==========================================

  async function changeStatus(reward: Reward) {
    if (processingRef.current) return;

    const action = reward.active
      ? "desactivar"
      : "activar";

    const confirmed = window.confirm(
      `¿Seguro que deseas ${action} "${reward.name}"?`
    );

    if (!confirmed) return;

    processingRef.current = true;
    setProcessingId(reward._id);
    setError("");
    setMessage("");

    try {
      if (reward.active) {
        await api.patch(
          `/api/rewards/manage/${reward._id}/deactivate`
        );
      } else {
        await api.patch(
          `/api/rewards/manage/${reward._id}`,
          { active: true }
        );
      }

      await loadRewards();

      setMessage(
        reward.active
          ? "Recompensa desactivada correctamente."
          : "Recompensa activada correctamente."
      );
    } catch (err: unknown) {
      console.error(
        "Error cambiando estado:",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      processingRef.current = false;
      setProcessingId(null);
    }
  }

  // ==========================================
  // CONTADORES
  // ==========================================

  const activeCount = rewards.filter(
    (reward) => reward.active
  ).length;

  const inactiveCount = rewards.filter(
    (reward) => !reward.active
  ).length;

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="admin-rewards-page">
      <header className="admin-rewards-header">
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Volver
        </button>

        <h1>Administrar recompensas</h1>

        <p>
          Crea y administra las recompensas
          disponibles en Ñam+.
        </p>
      </header>

      <main className="admin-rewards-container">

        {/* ================================= */}
        {/* RESUMEN */}
        {/* ================================= */}

        <section className="admin-rewards-summary">
          <div>
            <span>Total de recompensas</span>
            <h2>
              {loading ? "—" : rewards.length}
            </h2>
          </div>

          <div>
            <span>Recompensas activas</span>
            <h2>
              {loading ? "—" : activeCount}
            </h2>
          </div>

          <div>
            <span>Recompensas inactivas</span>
            <h2>
              {loading ? "—" : inactiveCount}
            </h2>
          </div>
        </section>

        {/* ================================= */}
        {/* BOTONES PRINCIPALES */}
        {/* ================================= */}

        <div className="admin-rewards-toolbar">
          <button
            type="button"
            className="admin-create-btn"
            onClick={openCreate}
            disabled={
              saving ||
              processingId !== null
            }
          >
            + Nueva recompensa
          </button>

          <button
            type="button"
            className="admin-reload-btn"
            onClick={() => void loadRewards()}
            disabled={
              loading ||
              saving ||
              processingId !== null
            }
          >
            ↻ Actualizar
          </button>
        </div>

        {/* ================================= */}
        {/* MENSAJES */}
        {/* ================================= */}

        {message && (
          <div
            className="admin-rewards-success"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="admin-rewards-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* ================================= */}
        {/* FORMULARIO */}
        {/* ================================= */}

        {showForm && (
          <section className="admin-rewards-form-card">
            <div className="admin-rewards-form-heading">
              <h2>
                {editingId
                  ? "Editar recompensa"
                  : "Crear nueva recompensa"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(event) =>
                void saveReward(event)
              }
            >
              <div className="admin-rewards-form-grid">
                <label>
                  Nombre de la recompensa

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Ej. Pizza mediana"
                    required
                  />
                </label>

                <label>
                  Costo en puntos

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.pointsCost}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        pointsCost: event.target.value,
                      })
                    }
                    placeholder="Ej. 300"
                    required
                  />
                </label>

                <label>
                  Inventario disponible

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        stock: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  URL de la imagen

                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        imageUrl: event.target.value,
                      })
                    }
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </label>

                <label className="admin-form-full">
                  Descripción

                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    placeholder="Describe la recompensa..."
                  />
                </label>

                {isAdmin && !editingId && (
                  <label className="admin-form-full">
                    ID del restaurante en MongoDB

                    <input
                      type="text"
                      value={form.restaurantId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          restaurantId:
                            event.target.value,
                        })
                      }
                      placeholder="ObjectId del restaurante"
                      required
                    />

                    <small>
                      Utiliza el _id del restaurante,
                      no el del usuario.
                    </small>
                  </label>
                )}
              </div>

              <label className="admin-rewards-checkbox">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      active: event.target.checked,
                    })
                  }
                />

                Recompensa activa
              </label>

              <div className="admin-rewards-form-actions">
                <button
                  type="submit"
                  className="admin-create-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : editingId
                    ? "Guardar cambios"
                    : "Crear recompensa"}
                </button>

                <button
                  type="button"
                  className="admin-reload-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ================================= */}
        {/* LISTADO DE RECOMPENSAS */}
        {/* ================================= */}

        {loading ? (
          <div className="admin-rewards-empty">
            Cargando recompensas...
          </div>
        ) : error && rewards.length === 0 ? (
          <div className="admin-rewards-empty">
            No fue posible consultar las recompensas.
          </div>
        ) : rewards.length === 0 ? (
          <div className="admin-rewards-empty">
            <h2>Sin recompensas</h2>
            <p>
              Presiona "Nueva recompensa"
              para comenzar.
            </p>
          </div>
        ) : (
          <section className="admin-rewards-list">
            {rewards.map((reward) => (
              <article
                className="admin-reward-card"
                key={reward._id}
              >
                {reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="admin-reward-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="admin-reward-placeholder">
                    🎁
                  </div>
                )}

                <div className="admin-reward-content">
                  <div className="admin-reward-title">
                    <h2>{reward.name}</h2>

                    <span
                      className={
                        reward.active
                          ? "admin-status-active"
                          : "admin-status-inactive"
                      }
                    >
                      {reward.active
                        ? "Activa"
                        : "Inactiva"}
                    </span>
                  </div>

                  <p className="admin-reward-restaurant">
                    {reward.restaurantName}
                  </p>

                  <p className="admin-reward-description">
                    {reward.description ||
                      "Sin descripción"}
                  </p>

                  <div className="admin-reward-details">
                    <strong>
                      ⭐ {reward.pointsCost} puntos
                    </strong>

                    <span>
                      Inventario: {reward.stock}
                    </span>
                  </div>

                  <div className="admin-reward-buttons">
                    <button
                      type="button"
                      className="admin-edit-btn"
                      onClick={() => openEdit(reward)}
                      disabled={
                        saving ||
                        processingId !== null
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className={
                        reward.active
                          ? "admin-deactivate-btn"
                          : "admin-activate-btn"
                      }
                      disabled={
                        saving ||
                        processingId !== null
                      }
                      onClick={() =>
                        void changeStatus(reward)
                      }
                    >
                      {processingId === reward._id
                        ? "Procesando..."
                        : reward.active
                        ? "Desactivar"
                        : "Activar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
