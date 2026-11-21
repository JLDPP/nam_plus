import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  // ==========================================
  // IDIOMA, USUARIO Y TEMA
  // ==========================================

  const { t, i18n } = useTranslation();

  const locale = i18n.resolvedLanguage?.startsWith("en")
    ? "en-US"
    : "es-MX";

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const theme =
    (localStorage.getItem("theme") as "dark" | "light") || "dark";

  // ==========================================
  // ESTADOS
  // ==========================================

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [points, setPoints] = useState(0);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState(false);

  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // ==========================================
  // CARGAR PROMOCIONES
  // ==========================================

  useEffect(() => {
    async function loadPromotions() {
      try {
        const data = await getPromotions();
        setPromotions(data.filter((promotion) => promotion.active));
      } catch (error) {
        console.error("Error cargando promociones en dashboard:", error);
      }
    }

    void loadPromotions();
  }, []);

  // ==========================================
  // CARGAR SALDO REAL
  // ==========================================

  useEffect(() => {
    async function loadPoints() {
      try {
        setPointsLoading(true);
        setPointsError(false);

        const balance = await getPointsBalance();
        setPoints(balance);
      } catch (error) {
        console.error("Error consultando saldo de puntos:", error);
        setPointsError(true);
      } finally {
        setPointsLoading(false);
      }
    }

    void loadPoints();
  }, []);

  // ==========================================
  // CARGAR ACTIVIDAD RECIENTE
  // ==========================================

  useEffect(() => {
    async function loadActivity() {
      try {
        setActivityLoading(true);

        const data = await getPointsHistory();
        setTransactions(data.slice(0, 5));
      } catch (error) {
        console.error("Error cargando actividad de puntos:", error);
      } finally {
        setActivityLoading(false);
      }
    }

    void loadActivity();
  }, []);

  // ==========================================
  // CERRAR SESIÓN Y NAVEGACIÓN
  // ==========================================

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

  // ==========================================
  // FORMATO DE ACTIVIDAD
  // ==========================================

  function formatTransactionDate(date: string) {
    return new Date(date).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getTransactionLabel(transaction: PointsTransaction) {
    if (transaction.description) {
      return transaction.description;
    }

    if (transaction.type === "earn") {
      return t("dashboard.earn");
    }

    if (transaction.type === "redeem") {
      return t("dashboard.redeemActivity");
    }

    return t("dashboard.adjustment");
  }

  function getTransactionPoints(transaction: PointsTransaction) {
    const amount = Math.abs(transaction.points);

    if (transaction.type === "redeem") {
      return `-${amount}`;
    }

    if (transaction.type === "earn") {
      return `+${amount}`;
    }

    return transaction.points > 0 ? `+${amount}` : `-${amount}`;
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className={`dashboard-page ${theme}`}>
      <div className="dashboard-bg dashboard-bg-left"></div>
      <div className="dashboard-bg dashboard-bg-right"></div>

      <div className="dashboard-container">
        {/* ENCABEZADO */}
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <img src={logo} alt="Logo Ñam+" className="brand-logo" />

            <div>
              <h1 className="dashboard-logo">Ñam+</h1>
              <p className="dashboard-subtitle">{t("dashboard.welcome")}</p>
            </div>
          </div>

          <div className="dashboard-user-box">
            <span className="dashboard-user">
              {t("dashboard.hello")},{" "}
              {user.name || t("dashboard.userFallback")}
            </span>

            <button className="settings-btn" onClick={goToSettings}>
              ⚙ {t("dashboard.settings")}
            </button>

            <button className="logout-btn" onClick={logout}>
              {t("dashboard.logout")}
            </button>
          </div>
        </header>

        <main className="dashboard-grid">
          {/* PUNTOS REALES */}
          <section className="dashboard-card points-card">
            <p className="card-label">{t("dashboard.points")}</p>

            {pointsLoading ? (
              <h2>{t("dashboard.loadingPoints")}</h2>
            ) : pointsError ? (
              <h2>{t("dashboard.pointsError")}</h2>
            ) : (
              <h2>{points.toLocaleString(locale)} pts</h2>
            )}

            <span className="card-extra">{t("dashboard.keepEarning")}</span>

            <div className="action-buttons">
              <button className="primary-btn" onClick={goToPoints}>
                {t("dashboard.viewPoints")}
              </button>

              <button className="secondary-btn" onClick={goToRewards}>
                {t("dashboard.viewRewards")}
              </button>
            </div>
          </section>

          {/* PROMOCIONES DESTACADAS */}
          <section className="dashboard-card">
            <h2 className="section-title">{t("dashboard.promotions")}</h2>

            <div className="promo-list">
              {promotions.length === 0 ? (
                <div className="promo-card">
                  <h3>{t("dashboard.noPromotions")}</h3>
                </div>
              ) : (
                promotions.slice(0, 2).map((promotion) => (
                  <div
                    key={promotion._id}
                    className="promo-card"
                    onClick={() => {
                      window.location.href = `/promociones/${promotion._id}`;
                    }}
                  >
                    {promotion.imageUrl && (
                      <img
                        src={promotion.imageUrl}
                        alt={promotion.title}
                        className="dashboard-promo-image"
                      />
                    )}

                    <h3>{promotion.title}</h3>
                    <p>{promotion.restaurantName}</p>
                  </div>
                ))
              )}
            </div>

            {promotions.length > 2 && (
              <div className="action-buttons">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={goToRewards}
                >
                  {locale === "en-US"
                    ? "View all promotions →"
                    : "Ver todas las promociones →"}
                </button>
              </div>
            )}
          </section>

          {/* CANJEAR TICKET */}
          <section className="dashboard-card">
            <h2 className="section-title">{t("dashboard.redeem")}</h2>

            <div className="action-buttons">
              <button className="primary-btn" onClick={goToQr}>
                {t("dashboard.scanQR")}
              </button>

              <button className="secondary-btn" onClick={goToCode}>
                {t("dashboard.enterCode")}
              </button>
            </div>
          </section>

          {/* ACTIVIDAD RECIENTE */}
          <section className="dashboard-card">
            <h2 className="section-title">{t("dashboard.activity")}</h2>

            <div className="activity-list">
              {activityLoading ? (
                <div className="activity-item">
                  {t("dashboard.loadingActivity")}
                </div>
              ) : transactions.length === 0 ? (
                <div className="activity-item">
                  {t("dashboard.noActivity")}
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div className="activity-item" key={transaction._id}>
                    <div>
                      <strong>{getTransactionLabel(transaction)}</strong>

                      <small
                        style={{
                          display: "block",
                          opacity: 0.7,
                          marginTop: "5px",
                        }}
                      >
                        {formatTransactionDate(transaction.createdAt)}
                      </small>
                    </div>

                    <strong>{getTransactionPoints(transaction)} pts</strong>
                  </div>
                ))
              )}
            </div>

            <button className="secondary-btn" onClick={goToHistory}>
              {t("dashboard.viewHistory")}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}