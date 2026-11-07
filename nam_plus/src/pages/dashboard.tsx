
/*
  ARCHIVO: dashboard.tsx

  FUNCIÓN:
  Pantalla principal del usuario después de iniciar sesión.

  FUNCIONES CONSERVADAS:
  - Navegación hacia escaneo QR.
  - Navegación hacia ingreso manual de código.
  - Sistema de idioma Español / English.
  - Tema claro / oscuro.
  - Acceso a Configuración.
  - Cierre de sesión.
  - Promociones reales desde MongoDB.
  - Imágenes de promociones.
  - Navegación al detalle de promociones.

  NUEVAS FUNCIONES:
  - Consulta del saldo real de puntos desde MongoDB.
  - Consulta de movimientos reales de puntos.
  - Acceso al catálogo de recompensas.
  - Acceso a la pantalla de mis puntos.
  - Acceso al historial de canjes.
*/

import {
  useEffect,
  useState,
} from "react";

import logo from "../assets/logo.jpeg";

import {
  getPromotions,
  type Promotion,
} from "../services/promotion.service";

import {
  getPointsBalance,
  getPointsHistory,
  type PointsTransaction,
} from "../services/points.service";

import "../styles/dashboard.css";

export default function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const theme =
    (localStorage.getItem("theme") as "dark" | "light") || "dark";

  const language =
    (localStorage.getItem("language") as "es" | "en") || "es";

  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [points, setPoints] = useState(0);

  const [pointsLoading, setPointsLoading] =
    useState(true);

  const [pointsError, setPointsError] =
    useState(false);

  const [transactions, setTransactions] =
    useState<PointsTransaction[]>([]);

  const [activityLoading, setActivityLoading] =
    useState(true);

  // Cargar promociones
  useEffect(() => {
    async function loadPromotions() {
      try {
        const data = await getPromotions();

        setPromotions(
          data.filter(
            (promotion) => promotion.active
          )
        );
      } catch (error) {
        console.error(
          "Error cargando promociones en dashboard:",
          error
        );
      }
    }

    loadPromotions();
  }, []);

  // Cargar saldo real de puntos
  useEffect(() => {
    async function loadPoints() {
      try {
        setPointsLoading(true);
        setPointsError(false);

        const balance = await getPointsBalance();

        setPoints(balance);
      } catch (error) {
        console.error(
          "Error consultando saldo de puntos:",
          error
        );

        setPointsError(true);
      } finally {
        setPointsLoading(false);
      }
    }

    loadPoints();
  }, []);

  // Cargar actividad real de puntos
  useEffect(() => {
    async function loadActivity() {
      try {
        setActivityLoading(true);

        const data = await getPointsHistory();

        setTransactions(data.slice(0, 5));
      } catch (error) {
        console.error(
          "Error cargando actividad de puntos:",
          error
        );
      } finally {
        setActivityLoading(false);
      }
    }

    loadActivity();
  }, []);

  const translations = {
    es: {
      welcome: "Bienvenido de nuevo, disfruta tus recompensas",
      hello: "Hola",
      settings: "Configuración",
      logout: "Cerrar sesión",
      points: "Mis puntos",
      keepEarning: "Sigue acumulando para más recompensas",
      promotions: "Promociones destacadas",
      redeem: "Canjear ticket",
      scanQR: "Escanear QR",
      enterCode: "Ingresar código",
      activity: "Actividad reciente",
      userFallback: "Usuario",
      noPromotions: "No hay promociones disponibles",
      viewPoints: "Ver mis puntos",
      viewRewards: "Ver recompensas",
      viewHistory: "Historial de canjes",
      loadingPoints: "Cargando puntos...",
      pointsError: "No fue posible cargar tus puntos",
      noActivity: "Todavía no tienes movimientos de puntos",
      loadingActivity: "Cargando actividad...",
      pointsUnit: "puntos",
      earn: "Puntos ganados",
      redeemActivity: "Puntos utilizados",
      adjustment: "Ajuste de puntos",
    },

    en: {
      welcome: "Welcome back, enjoy your rewards",
      hello: "Hello",
      settings: "Settings",
      logout: "Log out",
      points: "My points",
      keepEarning: "Keep earning points for more rewards",
      promotions: "Featured promotions",
      redeem: "Redeem ticket",
      scanQR: "Scan QR",
      enterCode: "Enter code",
      activity: "Recent activity",
      userFallback: "User",
      noPromotions: "No promotions available",
      viewPoints: "View my points",
      viewRewards: "View rewards",
      viewHistory: "Redemption history",
      loadingPoints: "Loading points...",
      pointsError: "Unable to load your points",
      noActivity: "You don't have any points activity yet",
      loadingActivity: "Loading activity...",
      pointsUnit: "points",
      earn: "Points earned",
      redeemActivity: "Points used",
      adjustment: "Points adjustment",
    },
  };

  const t = translations[language];

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  }

  function goToSettings() {
    window.location.href = "/configuracion";
  }

  function goToCode() {
    window.location.href = "/codigo";
  }

  function goToQr() {
    window.location.href = "/qr";
  }

  function goToPoints() {
    window.location.href = "/puntos";
  }

  function goToRewards() {
    window.location.href = "/canjes";
  }

  function goToHistory() {
    window.location.href = "/historial-canjes";
  }

  function formatTransactionDate(date: string) {
    return new Date(date).toLocaleDateString(
      language === "es" ? "es-MX" : "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getTransactionLabel(
    transaction: PointsTransaction
  ) {
    if (transaction.description) {
      return transaction.description;
    }

    if (transaction.type === "earn") {
      return t.earn;
    }

    if (transaction.type === "redeem") {
      return t.redeemActivity;
    }

    return t.adjustment;
  }

  function getTransactionPoints(
    transaction: PointsTransaction
  ) {
    const amount = Math.abs(transaction.points);

    if (transaction.type === "redeem") {
      return `-${amount}`;
    }

    if (transaction.type === "earn") {
      return `+${amount}`;
    }

    return transaction.points > 0
      ? `+${amount}`
      : `-${amount}`;
  }

  return (
    <div className={`dashboard-page ${theme}`}>
      <div className="dashboard-bg dashboard-bg-left"></div>
      <div className="dashboard-bg dashboard-bg-right"></div>

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <img
              src={logo}
              alt="Logo Ñam+"
              className="brand-logo"
            />

            <div>
              <h1 className="dashboard-logo">
                Ñam+
              </h1>

              <p className="dashboard-subtitle">
                {t.welcome}
              </p>
            </div>
          </div>

          <div className="dashboard-user-box">
            <span className="dashboard-user">
              {t.hello}, {user.name || t.userFallback}
            </span>

            <button
              className="settings-btn"
              onClick={goToSettings}
            >
              ⚙ {t.settings}
            </button>

            <button
              className="logout-btn"
              onClick={logout}
            >
              {t.logout}
            </button>
          </div>
        </header>

        <main className="dashboard-grid">

          {/* PUNTOS REALES */}
          <section className="dashboard-card points-card">
            <p className="card-label">
              {t.points}
            </p>

            {pointsLoading ? (
              <h2>{t.loadingPoints}</h2>
            ) : pointsError ? (
              <h2>{t.pointsError}</h2>
            ) : (
              <h2>
                {points.toLocaleString(
                  language === "es" ? "es-MX" : "en-US"
                )} pts
              </h2>
            )}

            <span className="card-extra">
              {t.keepEarning}
            </span>

            <div className="action-buttons">
              <button
                className="primary-btn"
                onClick={goToPoints}
              >
                {t.viewPoints}
              </button>

              <button
                className="secondary-btn"
                onClick={goToRewards}
              >
                {t.viewRewards}
              </button>
            </div>
          </section>

          {/* PROMOCIONES */}
          <section className="dashboard-card">
            <h2 className="section-title">
              {t.promotions}
            </h2>

            <div className="promo-list">
              {promotions.length === 0 ? (
                <div className="promo-card">
                  <h3>{t.noPromotions}</h3>
                </div>
              ) : (
                promotions
                  .slice(0, 2)
                  .map((promotion) => (
                    <div
                      className="promo-card"
                      key={promotion._id}
                      onClick={() => {
                        window.location.href =
                          `/promociones/${promotion._id}`;
                      }}
                    >
                      {promotion.imageUrl && (
                        <img
                          src={promotion.imageUrl}
                          alt={promotion.title}
                          className="dashboard-promo-image"
                        />
                      )}

                      <h3>
                        {promotion.title}
                      </h3>

                      <p>
                        {promotion.restaurantName}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* CANJEAR TICKET */}
          <section className="dashboard-card">
            <h2 className="section-title">
              {t.redeem}
            </h2>

            <div className="action-buttons">
              <button
                className="primary-btn"
                onClick={goToQr}
              >
                {t.scanQR}
              </button>

              <button
                className="secondary-btn"
                onClick={goToCode}
              >
                {t.enterCode}
              </button>
            </div>
          </section>

          {/* ACTIVIDAD REAL */}
          <section className="dashboard-card">
            <h2 className="section-title">
              {t.activity}
            </h2>

            <div className="activity-list">
              {activityLoading ? (
                <div className="activity-item">
                  {t.loadingActivity}
                </div>
              ) : transactions.length === 0 ? (
                <div className="activity-item">
                  {t.noActivity}
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    className="activity-item"
                    key={transaction._id}
                  >
                    <div>
                      <strong>
                        {getTransactionLabel(transaction)}
                      </strong>

                      <small
                        style={{
                          display: "block",
                          opacity: 0.7,
                          marginTop: "5px",
                        }}
                      >
                        {formatTransactionDate(
                          transaction.createdAt
                        )}
                      </small>
                    </div>

                    <strong>
                      {getTransactionPoints(transaction)} pts
                    </strong>
                  </div>
                ))
              )}
            </div>

            <button
              className="secondary-btn"
              onClick={goToHistory}
            >
              {t.viewHistory}
            </button>
          </section>

        </main>
      </div>
    </div>
  );
}
