import {
  useEffect,
  useState,
} from "react";

import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotion,
  type Promotion,
} from "../services/promotion.service";

import "../styles/promociones.css";

export default function Promociones() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin =
    user.role === "admin";

  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [restaurantName, setRestaurantName] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [minAmount, setMinAmount] =
    useState("");

  const [points, setPoints] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  async function loadPromotions() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getPromotions();

      if (isAdmin) {
        setPromotions(data);
      } else {
        const today =
          new Date();

        setPromotions(
          data.filter(
            (promotion) => {
              if (!promotion.active) {
                return false;
              }

              if (
                promotion.startDate &&
                new Date(
                  promotion.startDate
                ) > today
              ) {
                return false;
              }

              if (
                promotion.endDate &&
                new Date(
                  promotion.endDate
                ) < today
              ) {
                return false;
              }

              return true;
            }
          )
        );
      }
    } catch (error) {
      console.error(
        "Error cargando promociones:",
        error
      );

      setError(
        "No se pudieron cargar las promociones."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  function clearForm() {
    setTitle("");
    setDescription("");
    setRestaurantName("");
    setImageUrl("");
    setMinAmount("");
    setPoints("");
    setStartDate("");
    setEndDate("");
    setEditingId(null);
  }

  function handleEdit(
    promotion: Promotion
  ) {
    setEditingId(
      promotion._id
    );

    setTitle(
      promotion.title
    );

    setDescription(
      promotion.description || ""
    );

    setRestaurantName(
      promotion.restaurantName
    );

    setImageUrl(
      promotion.imageUrl || ""
    );

    setMinAmount(
      String(
        promotion.minAmount
      )
    );

    setPoints(
      String(
        promotion.points
      )
    );

    setStartDate(
      promotion.startDate
        ? promotion.startDate.slice(
            0,
            10
          )
        : ""
    );

    setEndDate(
      promotion.endDate
        ? promotion.endDate.slice(
            0,
            10
          )
        : ""
    );

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    clearForm();

    setError("");
    setMessage("");
  }

  async function handleDelete(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "¿Seguro que deseas eliminar esta promoción?"
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deletePromotion(id);

      if (editingId === id) {
        clearForm();
      }

      setMessage(
        "Promoción eliminada correctamente."
      );

      await loadPromotions();
    } catch (error) {
      console.error(
        "Error eliminando promoción:",
        error
      );

      setError(
        "No se pudo eliminar la promoción."
      );
    }
  }

  async function handleToggleActive(
    promotion: Promotion
  ) {
    setError("");
    setMessage("");

    try {
      await updatePromotion(
        promotion._id,
        {
          title:
            promotion.title,

          description:
            promotion.description || "",

          restaurantName:
            promotion.restaurantName,

          imageUrl:
            promotion.imageUrl || "",

          minAmount:
            promotion.minAmount,

          points:
            promotion.points,

          active:
            !promotion.active,

          startDate:
            promotion.startDate,

          endDate:
            promotion.endDate || null,
        }
      );

      setMessage(
        promotion.active
          ? "Promoción desactivada correctamente."
          : "Promoción activada correctamente."
      );

      await loadPromotions();
    } catch (error) {
      console.error(
        "Error cambiando estado de promoción:",
        error
      );

      setError(
        "No se pudo cambiar el estado de la promoción."
      );
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!title.trim()) {
      setError(
        "Ingresa el nombre de la promoción."
      );
      return;
    }

    if (!restaurantName.trim()) {
      setError(
        "Ingresa el nombre del restaurante."
      );
      return;
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      setError(
        "La fecha límite no puede ser anterior a la fecha de inicio."
      );
      return;
    }

    setSaving(true);

    const promotionData = {
      title:
        title.trim(),

      description:
        description.trim(),

      restaurantName:
        restaurantName.trim(),

      imageUrl:
        imageUrl.trim(),

      minAmount:
        Number(minAmount) || 0,

      points:
        Number(points) || 0,

      active: true,

      startDate:
        startDate || undefined,

      endDate:
        endDate || null,
    };

    try {
      if (editingId) {
        await updatePromotion(
          editingId,
          promotionData
        );

        setMessage(
          "Promoción actualizada correctamente."
        );
      } else {
        await createPromotion(
          promotionData
        );

        setMessage(
          "Promoción creada correctamente."
        );
      }

      clearForm();

      await loadPromotions();
    } catch (error) {
      console.error(
        editingId
          ? "Error actualizando promoción:"
          : "Error creando promoción:",
        error
      );

      setError(
        editingId
          ? "No se pudo actualizar la promoción."
          : "No se pudo crear la promoción."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="promotions-page">
      <div className="promotions-container">

        <div className="promotions-header">
          <div>
            <h1>
              Promociones
            </h1>

            <p>
              {isAdmin
                ? "Administra las promociones disponibles en Ñam+"
                : "Descubre las promociones disponibles en Ñam+"}
            </p>
          </div>

          <button
            type="button"
            className="promotions-back-btn"
            onClick={() => {
              window.location.href =
                "/dashboard";
            }}
          >
            Volver
          </button>
        </div>

        {isAdmin && (
          <section className="promotion-form-card">

            <h2>
              {editingId
                ? "Editar promoción"
                : "Crear promoción"}
            </h2>

            <form
              className="promotion-form"
              onSubmit={handleSubmit}
            >

              <div className="promotion-form-group">
                <label>
                  Nombre de la promoción
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Ej. 20% de descuento"
                />
              </div>

              <div className="promotion-form-group">
                <label>
                  Restaurante
                </label>

                <input
                  type="text"
                  value={restaurantName}
                  onChange={(event) =>
                    setRestaurantName(
                      event.target.value
                    )
                  }
                  placeholder="Ej. Restaurante Demo"
                />
              </div>

              <div className="promotion-form-group promotion-form-full">
                <label>
                  Imagen de la promoción
                </label>

                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) =>
                    setImageUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://ejemplo.com/producto.jpg"
                />
              </div>

              <div className="promotion-form-group promotion-form-full">
                <label>
                  Descripción
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Describe la promoción"
                  rows={4}
                />
              </div>

              <div className="promotion-form-group">
                <label>
                  Compra mínima
                </label>

                <input
                  type="number"
                  min="0"
                  value={minAmount}
                  onChange={(event) =>
                    setMinAmount(
                      event.target.value
                    )
                  }
                  placeholder="300"
                />
              </div>

              <div className="promotion-form-group">
                <label>
                  Puntos
                </label>

                <input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(event) =>
                    setPoints(
                      event.target.value
                    )
                  }
                  placeholder="100"
                />
              </div>

              <div className="promotion-form-group">
                <label>
                  Fecha de inicio
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="promotion-form-group">
                <label>
                  Fecha límite
                </label>

                <input
                  type="date"
                  value={endDate}
                  min={
                    startDate ||
                    undefined
                  }
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
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
                      : "Crear promoción"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="promotion-cancel-btn"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancelar edición
                  </button>
                )}

              </div>
            </form>

            {error && (
              <p className="promotions-error">
                {error}
              </p>
            )}

            {message && (
              <p className="promotions-success">
                {message}
              </p>
            )}

          </section>
        )}

        <h2 className="promotions-list-title">
          Promociones disponibles
        </h2>

        {loading && (
          <p className="promotions-message">
            Cargando promociones...
          </p>
        )}

        {!loading &&
          !error &&
          promotions.length === 0 && (
            <p className="promotions-message">
              No hay promociones disponibles.
            </p>
          )}

        <div className="promotions-grid">

          {promotions.map(
            (promotion) => (

              <article
                className={`promotion-card ${
                  !promotion.active
                    ? "promotion-card-inactive"
                    : ""
                }`}
                key={promotion._id}
              >

                {promotion.imageUrl && (
                  <img
                    src={
                      promotion.imageUrl
                    }
                    alt={
                      promotion.title
                    }
                    className="promotion-image"
                  />
                )}

                <div className="promotion-card-header">

                  <span className="promotion-badge">
                    Promoción
                  </span>

                  {promotion.points > 0 && (
                    <span className="promotion-points">
                      +
                      {promotion.points}
                      {" "}
                      pts
                    </span>
                  )}

                </div>

                {isAdmin && (
                  <div
                    className={
                      promotion.active
                        ? "promotion-status-active"
                        : "promotion-status-inactive"
                    }
                  >
                    {promotion.active
                      ? "Activa"
                      : "Inactiva"}
                  </div>
                )}

                <h2>
                  {promotion.title}
                </h2>

                <h3>
                  {promotion.restaurantName}
                </h3>

                {promotion.description && (
                  <p>
                    {promotion.description}
                  </p>
                )}

                {promotion.minAmount > 0 && (
                  <div className="promotion-condition">
                    Compra mínima: $
                    {promotion.minAmount}
                  </div>
                )}

                {promotion.startDate && (
                  <div className="promotion-condition">
                    Fecha de inicio:{" "}
                    {new Date(
                      promotion.startDate
                    ).toLocaleDateString(
                      "es-MX"
                    )}
                  </div>
                )}

                {promotion.endDate && (
                  <div className="promotion-condition">
                    Fecha límite:{" "}
                    {new Date(
                      promotion.endDate
                    ).toLocaleDateString(
                      "es-MX"
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="promotion-admin-actions">

                    <button
                      type="button"
                      className="promotion-edit-btn"
                      onClick={() =>
                        handleEdit(
                          promotion
                        )
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
                      onClick={() =>
                        handleToggleActive(
                          promotion
                        )
                      }
                    >
                      {promotion.active
                        ? "Desactivar"
                        : "Activar"}
                    </button>

                    <button
                      type="button"
                      className="promotion-delete-btn"
                      onClick={() =>
                        handleDelete(
                          promotion._id
                        )
                      }
                    >
                      Eliminar
                    </button>

                  </div>
                )}

              </article>
            )
          )}

        </div>

      </div>
    </div>
  );
}