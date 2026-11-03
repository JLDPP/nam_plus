import "./dashboard.css";

export default function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-bg dashboard-bg-left"></div>
      <div className="dashboard-bg dashboard-bg-right"></div>

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-logo">Ñam+</h1>
            <p className="dashboard-subtitle">
              Bienvenido de nuevo, disfruta tus recompensas
            </p>
          </div>

          <div className="dashboard-user-box">
            <span className="dashboard-user">
              Hola, {user.name || "Usuario"}
            </span>

            <button
              className="logout-btn"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="dashboard-grid">
          <section className="dashboard-card points-card">
            <p className="card-label">Mis puntos</p>
            <h2>1,250 pts</h2>
            <span className="card-extra">
              Sigue acumulando para más recompensas
            </span>
          </section>

          <section className="dashboard-card">
            <h2 className="section-title">
              Promociones destacadas
            </h2>

            <div className="promo-list">
              <div className="promo-card">
                <h3>20% de descuento</h3>
                <p>Restaurante Demo</p>
              </div>

              <div className="promo-card">
                <h3>Bebida gratis</h3>
                <p>Con compras mayores a $300</p>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <h2 className="section-title">
              Canjear ticket
            </h2>

            <div className="action-buttons">
              <button className="primary-btn">
                Escanear QR
              </button>

              <button className="secondary-btn">
                Ingresar código
              </button>
            </div>
          </section>

          <section className="dashboard-card">
            <h2 className="section-title">
              Actividad reciente
            </h2>

            <div className="activity-list">
              <div className="activity-item">
                <span>+100 puntos por compra</span>
              </div>

              <div className="activity-item">
                <span>-500 puntos por canje</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}