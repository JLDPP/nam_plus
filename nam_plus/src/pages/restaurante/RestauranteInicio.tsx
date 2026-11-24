import { Link, useNavigate } from "react-router-dom";
import { Coins, Gift, History, House, Store, Ticket, type LucideIcon } from "lucide-react";

import { setAuth } from "../../api";
import logo from "../../assets/logo.jpeg";

import "./restaurante.css";

// TIPOS

type Modulo = {
  id: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  path?: string;
  action?: string;
};

// MÓDULOS DEL RESTAURANTE

const modulos: Modulo[] = [
  {
    id: "cupones",
    Icon: Ticket,
    title: "Generar cupón",
    description:
      "Genera tickets con códigos de texto y QR para tus clientes.",
    color: "cyan",
    path: "/generar-ticket",
    action: "Generar código",
  },
  {
    id: "puntos",
    Icon: Coins,
    title: "Transferir puntos",
    description:
      "Entrega puntos a tus clientes por las compras realizadas.",
    color: "green",
    path: "/restaurante/transferir-puntos",
    action: "Transferir puntos",
  },
  {
    id: "canjes",
    Icon: History,
    title: "Historial de canjes",
    description:
      "Consulta y administra los canjes de recompensas.",
    color: "purple",
    path: "/canjes-restaurante",
    action: "Consultar canjes",
  },
  {
    id: "perfil",
    Icon: Store,
    title: "Perfil del restaurante",
    description:
      "Actualiza la información y configuración de tu negocio.",
    color: "cyan",
  },
];

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

  // CERRAR SESIÓN

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setAuth(null);

    nav("/login", {
      replace: true,
    });
  }

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
          Herramientas
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
            <span className="rp-nav-icon"><House size={17} aria-hidden="true" /></span>
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
                  <modulo.Icon size={19} aria-hidden="true" />
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
                  <modulo.Icon size={19} aria-hidden="true" />
                </span>

                {modulo.title}
              </a>
            )
          )}

          <Link
            to="/admin-recompensas"
            className="rp-nav-link"
          >
            <span className="rp-nav-icon"><Gift size={17} aria-hidden="true" /></span>
            Recompensas
          </Link>
        </nav>

        {/* USUARIO */}

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

            <h1>Panel de administración</h1>

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
            <h2>¡Bienvenido, {userName}!</h2>

            <p>
              Acredita puntos por las compras y gestiona
              las recompensas y los canjes de tus clientes.
            </p>
          </div>

          <img
            src={logo}
            alt=""
            className="rp-welcome-logo"
          />
        </section>

        {/* HERRAMIENTAS */}

        <div className="rp-section-heading">
          <h2>Herramientas de administración</h2>
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
                <modulo.Icon size={19} aria-hidden="true" />
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

        {/* RECOMPENSAS */}

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