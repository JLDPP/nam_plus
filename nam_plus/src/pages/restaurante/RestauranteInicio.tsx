
import { Link, useNavigate } from "react-router-dom";

import { setAuth } from "../../api";
import logo from "../../assets/logo.jpeg";

import "./restaurante.css";

// ==========================================
// TIPOS
// ==========================================

type Modulo = {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  path?: string;
  action?: string;
};

// ==========================================
// MÓDULOS DEL RESTAURANTE
// ==========================================

const modulos: Modulo[] = [
  {
    id: "cupones",
    icon: "QR",
    title: "Generar cupón",
    description:
      "Genera tickets con códigos de texto y QR para tus clientes.",
    color: "cyan",
    path: "/generar-ticket",
    action: "Generar código",
  },
  {
    id: "promociones",
    icon: "%",
    title: "Publicar promociones",
    description:
      "Crea ofertas y beneficios exclusivos para tus clientes.",
    color: "orange",
  },
  {
    id: "puntos",
    icon: "+P",
    title: "Transferir puntos",
    description:
      "Entrega puntos a tus clientes por las compras realizadas.",
    color: "green",
  },
  {
    id: "canjes",
    icon: "✓",
    title: "Historial de canjes",
    description:
      "Consulta y administra los canjes de recompensas.",
    color: "purple",
    path: "/canjes-restaurante",
    action: "Consultar canjes",
  },
  {
    id: "historial-promociones",
    icon: "H",
    title: "Historial de promociones",
    description:
      "Consulta tus promociones activas, vencidas y pausadas.",
    color: "orange",
  },
  {
    id: "perfil",
    icon: "R",
    title: "Perfil del restaurante",
    description:
      "Actualiza la información y configuración de tu negocio.",
    color: "cyan",
  },
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function RestauranteInicio() {
  const nav = useNavigate();

  let userName = "Restaurante";

  try {
    const storedUser = localStorage.getItem("user");

    const user = storedUser
      ? JSON.parse(storedUser)
      : null;

    if (
      typeof user?.name === "string" &&
      user.name.trim()
    ) {
      userName = user.name.trim();
    }
  } catch {
    userName = "Restaurante";
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setAuth(null);

    nav("/login", {
      replace: true,
    });
  }

  // ==========================================
  // VISTA
  // ==========================================

  return (
    <div className="rp-layout">

      {/* MENÚ LATERAL */}

      <aside className="rp-sidebar">

        <div className="rp-brand">
          <img
            src={logo}
            alt="Ñam+"
            className="rp-logo"
          />

          <div>
            <h2>Ñam+</h2>
            <span>Restaurantes</span>
          </div>
        </div>

        <p className="rp-menu-label">
          MENÚ PRINCIPAL
        </p>

        <nav
          className="rp-navigation"
          aria-label="Menú de restaurantes"
        >

          <Link
            to="/restaurante"
            className="rp-nav-link rp-nav-active"
            aria-current="page"
          >
            <span className="rp-nav-icon">
              ▦
            </span>

            Inicio
          </Link>

          {modulos.map((modulo) =>
            modulo.path ? (
              <Link
                key={modulo.id}
                to={modulo.path}
                className="rp-nav-link"
              >
                <span className="rp-nav-icon">
                  {modulo.icon}
                </span>

                {modulo.title}
              </Link>
            ) : (
              <a
                key={modulo.id}
                href={`#${modulo.id}`}
                className="rp-nav-link"
              >
                <span className="rp-nav-icon">
                  {modulo.icon}
                </span>

                {modulo.title}
              </a>
            )
          )}

          <Link
            to="/admin-recompensas"
            className="rp-nav-link"
          >
            <span className="rp-nav-icon">
              ★
            </span>

            Recompensas
          </Link>

        </nav>

        {/* CUENTA DEL USUARIO */}

        <div className="rp-sidebar-footer">

          <div className="rp-account">
            <div className="rp-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="rp-account-info">
              <strong>{userName}</strong>
              <span>Cuenta de restaurante</span>
            </div>
          </div>

          <button
            className="rp-logout"
            type="button"
            onClick={logout}
          >
            Cerrar sesión
          </button>

        </div>

      </aside>

      {/* CONTENIDO PRINCIPAL */}

      <main className="rp-main">

        <header className="rp-header">

          <div>
            <span className="rp-eyebrow">
              PORTAL DE RESTAURANTES
            </span>

            <h1>
              Panel de administración
            </h1>

            <p>
              Gestiona las operaciones de tu
              restaurante desde un solo lugar.
            </p>
          </div>

          <span className="rp-role">
            Restaurante
          </span>

        </header>

        {/* BIENVENIDA */}

        <section className="rp-welcome">

          <div>
            <span className="rp-eyebrow">
              ÑAM+ PARA NEGOCIOS
            </span>

            <h2>
              ¡Bienvenido, {userName}!
            </h2>

            <p>
              Publica promociones, recompensa la
              lealtad de tus clientes y administra
              tus operaciones.
            </p>
          </div>

          <img
            src={logo}
            alt=""
            className="rp-welcome-logo"
          />

        </section>

        {/* RESUMEN DE HERRAMIENTAS */}

        <section
          className="rp-summary"
          aria-label="Resumen del portal"
        >

          <article className="rp-stat">
            <span>Herramientas del portal</span>
            <strong>6</strong>
            <small>Funciones principales</small>
          </article>

          <article className="rp-stat">
            <span>Acceso a tickets</span>
            <strong className="rp-text-cyan">
              QR
            </strong>
            <small>Generación de códigos</small>
          </article>

          <article className="rp-stat">
            <span>Canjes y recompensas</span>
            <strong className="rp-text-green">
              Gestión
            </strong>
            <small>Acceso a operaciones existentes</small>
          </article>

        </section>

        {/* MÓDULOS PRINCIPALES */}

        <div className="rp-section-heading">
          <h2>Herramientas de administración</h2>

          <p>
            Selecciona la operación que deseas realizar.
          </p>
        </div>

        <section className="rp-grid">

          {modulos.map((modulo) => (
            <article
              key={modulo.id}
              id={modulo.id}
              className="rp-card"
            >

              <div
                className={
                  `rp-card-icon rp-icon-${modulo.color}`
                }
                aria-hidden="true"
              >
                {modulo.icon}
              </div>

              <h3>{modulo.title}</h3>

              <p>{modulo.description}</p>

              {modulo.path ? (
                <Link
                  to={modulo.path}
                  className="rp-card-button"
                >
                  {modulo.action}
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <div className="rp-card-pending">
                  Pendiente de integración
                </div>
              )}

            </article>
          ))}

        </section>

        {/* RECOMPENSAS EXISTENTES */}

        <section className="rp-extra">

          <div>
            <h3>Administración de recompensas</h3>

            <p>
              Accede al catálogo de recompensas
              existente en Ñam+.
            </p>
          </div>

          <Link
            to="/admin-recompensas"
            className="rp-card-button"
          >
            Administrar recompensas
          </Link>

        </section>

        <footer className="rp-footer">
          Ñam+ · Portal de restaurantes
        </footer>

      </main>

    </div>
  );
}
