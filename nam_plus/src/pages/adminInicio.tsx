import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gift, Settings, UserRound, UsersRound } from "lucide-react";
import { setAuth } from "../api";
import "../styles/accounts.css";

export default function AdminInicio() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const links = [
    { to: "/admin-cuentas", label: "account.manage", Icon: UsersRound },
    { to: "/admin-recompensas", label: "account.editRewards", Icon: Gift },
    { to: "/perfil", label: "account.profile", Icon: UserRound },
    { to: "/configuracion", label: "dashboard.settings", Icon: Settings },
  ];

  return (
    <main className="account-page">
      <header className="account-heading">
        <h1>{t("account.admin")}</h1>
        <button type="button" className="account-secondary" onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuth(null);
          navigate("/login", { replace: true });
        }}>{t("dashboard.logout")}</button>
      </header>
      <nav className="account-grid" aria-label={t("dashboard.navigation")}>
        {links.map(({ to, label, Icon }) => (
          <Link className="account-card account-dashboard-link" to={to} key={to}>
            <Icon size={24} aria-hidden="true" /> {t(label)}
          </Link>
        ))}
      </nav>
    </main>
  );
}
