import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gift, History, House, Menu, Settings, X, Ticket, UserRound } from "lucide-react";
import { setAuth } from "../../api";
import logo from "../../assets/logo.jpeg";
import { useAccount } from "../../routes/protected.route";
import "./restaurante.css";

const modules = [
  { to: "/generar-ticket", title: "ticket", color: "cyan", Icon: Ticket },
  { to: "/canjes-restaurante", title: "redemptions", color: "purple", Icon: History },
  { to: "/admin-recompensas", title: "rewards", color: "green", Icon: Gift },
];

export default function RestauranteInicio() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { name } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const MenuIcon = menuOpen ? X : Menu;

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
    navigate("/login", { replace: true });
  }

  return (
    <div className="rp-layout">
      <aside className="rp-sidebar">
        <div className="rp-mobile-bar">
          <div className="rp-brand">
            <img src={logo} alt="" className="rp-logo" />
            <div><h2>Ñam+</h2><span>{t("account.restaurante")}</span></div>
          </div>
          <button type="button" className="rp-mobile-toggle" aria-expanded={menuOpen}
            aria-controls="restaurant-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <MenuIcon size={19} aria-hidden="true" /> {t("restaurantDashboard.menu")}
          </button>
        </div>

        <nav id="restaurant-navigation" className="rp-navigation" data-open={menuOpen}
          aria-label={t("dashboard.navigation")}>
          <Link to="/restaurante" className="rp-nav-link rp-nav-active" aria-current="page" onClick={() => setMenuOpen(false)}>
            <House size={19} aria-hidden="true" /> {t("dashboard.home")}
          </Link>
          {modules.map(({ to, title, Icon }) => (
            <Link to={to} key={to} className="rp-nav-link">
              <Icon size={19} aria-hidden="true" /> {t(`restaurantDashboard.${title}`)}
            </Link>
          ))}
          <Link to="/perfil" className="rp-nav-link">
            <UserRound size={19} aria-hidden="true" /> {t("account.profile")}
          </Link>
          <Link to="/configuracion" className="rp-nav-link">
            <Settings size={19} aria-hidden="true" /> {t("dashboard.settings")}
          </Link>
        </nav>

        <div className="rp-sidebar-footer">
          <div className="rp-account">
            <span className="rp-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
            <div className="rp-account-info"><strong>{name}</strong></div>
          </div>
          <button className="rp-logout" type="button" onClick={logout}>{t("dashboard.logout")}</button>
        </div>
      </aside>

      <main className="rp-main">
        <header className="rp-header"><h1>{t("restaurantDashboard.title")}</h1></header>
        <section className="rp-welcome">
          <div>
            <h2>{t("restaurantDashboard.welcome", { name })}</h2>
            <p>{t("restaurantDashboard.description")}</p>
          </div>
          <img src={logo} alt="" className="rp-welcome-logo" />
        </section>

        <div className="rp-grid">
          {modules.map(({ to, title, color, Icon }) => (
            <article key={to} className="rp-card">
              <div className={`rp-card-icon rp-icon-${color}`}><Icon size={20} aria-hidden="true" /></div>
              <h3>{t(`restaurantDashboard.${title}`)}</h3>
              <p>{t(`restaurantDashboard.${title}Description`)}</p>
              <Link to={to} className="rp-card-button">
                {t(`restaurantDashboard.${title}Action`)} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
