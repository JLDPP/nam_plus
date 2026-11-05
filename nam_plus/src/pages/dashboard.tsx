/*
  ARCHIVO: dashboard.tsx

  FUNCIÓN:
  Es la pantalla principal del usuario después de iniciar sesión.

  MODIFICACIONES REALIZADAS:
  - Se agregó navegación hacia la pantalla de escaneo QR.
  - Se agregó navegación hacia la pantalla de ingreso manual de código.
  - Se mantiene el sistema de idioma Español / English.
  - Se mantiene el tema claro / oscuro.
  - Se mantiene el acceso a Preferencias.
  - Se mantiene el cierre de sesión.
  - El botón "Escanear QR" dirige a /qr.
  - El botón "Ingresar código" dirige a /codigo.
  - El dashboard solo dirige al usuario; la validación se realiza en redeemCode().
  - Se agregaron promociones reales desde MongoDB.
  - Se muestran hasta 2 promociones destacadas.
  - Se muestra la imagen de la promoción si existe.
  - Se agregó navegación al detalle de la promoción al hacer clic.
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

  useEffect(() => {
    async function loadPromotions() {
      try {
        const data =
          await getPromotions();

        setPromotions(
          data.filter(
            (promotion) =>
              promotion.active
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

  const translations = {
    es: {
      welcome: "Bienvenido de nuevo, disfruta tus recompensas",
      hello: "Hola",
      settings: "Configuración",
      logout: "Cerrar sesión",
      points: "Mis puntos",
      keepEarning: "Sigue acumulando para más recompensas",
      promotions: "Promociones destacadas",
      discount: "20% de descuento",
      restaurant: "Restaurante Demo",
      freeDrink: "Bebida gratis",
      purchaseOver: "Con compras mayores a $300",
      redeem: "Canjear ticket",
      scanQR: "Escanear QR",
      enterCode: "Ingresar código",
      activity: "Actividad reciente",
      purchasePoints: "+100 puntos por compra",
      redeemPoints: "-500 puntos por canje",
      userFallback: "Usuario",
      noPromotions: "No hay promociones disponibles",
    },

    en: {
      welcome: "Welcome back, enjoy your rewards",
      hello: "Hello",
      settings: "Settings",
      logout: "Log out",
      points: "My points",
      keepEarning: "Keep earning points for more rewards",
      promotions: "Featured promotions",
      discount: "20% discount",
      restaurant: "Demo Restaurant",
      freeDrink: "Free drink",
      purchaseOver: "With purchases over $300",
      redeem: "Redeem ticket",
      scanQR: "Scan QR",
      enterCode: "Enter code",
      activity: "Recent activity",
      purchasePoints: "+100 points for purchase",
      redeemPoints: "-500 points for redemption",
      userFallback: "User",
      noPromotions: "No promotions available",
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
          <section className="dashboard-card points-card">
            <p className="card-label">
              {t.points}
            </p>

            <h2>1,250 pts</h2>

            <span className="card-extra">
              {t.keepEarning}
            </span>
          </section>

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

          <section className="dashboard-card">
            <h2 className="section-title">
              {t.activity}
            </h2>

            <div className="activity-list">
              <div className="activity-item">
                {t.purchasePoints}
              </div>

              <div className="activity-item">
                {t.redeemPoints}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}