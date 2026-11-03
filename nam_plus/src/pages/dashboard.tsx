import logo from "../assets/logo.jpeg";
import "../styles/dashboard.css";

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
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="brand">
          <img
            src={logo}
            alt="Logo Ñam+"
            className="brand-logo"
          />

          <div>
            <h1>Ñam+</h1>
            <p>
              Bienvenido de nuevo, disfruta tus recompensas
            </p>
          </div>
        </div>

        <div className="user-box">
          <span>Hola, {user.name || "Usuario"}</span>

          <button onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="card points-card">
          <p>Mis puntos</p>
          <h2>1,250 pts</h2>
          <span>
            Sigue acumulando para más recompensas
          </span>
        </section>

        <section className="card">
          <h2>Promociones destacadas</h2>

          <div className="promo-grid">
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

        <section className="card">
          <h2>Canjear ticket</h2>

          <div className="button-group">
            <button className="primary-btn">
              Escanear QR
            </button>

            <button className="secondary-btn">
              Ingresar código
            </button>
          </div>
        </section>

        <section className="card">
          <h2>Actividad reciente</h2>

          <div className="activity-list">
            <p>+100 puntos por compra</p>
            <p>-500 puntos por canje</p>
          </div>
        </section>
      </main>
    </div>
  );
}