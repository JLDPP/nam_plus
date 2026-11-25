import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Gift, LogOut, Settings, Store, UserRound, UsersRound, Utensils } from "lucide-react";
import { api, setAuth } from "../api";
import { useAccount, useOffline } from "../routes/protected.route";
import "../styles/accounts.css";
import "../styles/adminInicio.css";

interface Overview {
  clients: number;
  restaurants: number;
  activeRewards: number;
  recentAccounts: Array<{ id: string; name: string; role: "cliente" | "restaurante"; createdAt?: string }>;
}

const metrics = [
  { key: "clients", tone: "peach", Icon: UsersRound },
  { key: "restaurants", tone: "mint", Icon: Store },
  { key: "activeRewards", tone: "lavender", Icon: Gift },
] as const;

export default function AdminInicio() {
  const { t, i18n } = useTranslation();
  const { name } = useAccount();
  const offline = useOffline();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const locale = i18n.resolvedLanguage;
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  useEffect(() => {
    if (offline) return;
    const controller = new AbortController();
    api.get<Overview>("/api/auth/accounts/overview", { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) {
        setOverview(data);
        setFailed(false);
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setOverview(null);
        setFailed(true);
      }
    });
    return () => controller.abort();
  }, [attempt, offline]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
    navigate("/login", { replace: true });
  }

  return (
    <main className="account-page admin-home">
      <header className="admin-home-top">
        <div className="admin-home-brand"><Utensils size={19} aria-hidden="true" /> Ñam+</div>
        <div className="admin-home-actions">
          <Link to="/configuracion" title={t("dashboard.settings")} aria-label={t("dashboard.settings")}>
            <Settings size={19} aria-hidden="true" />
          </Link>
          <button type="button" onClick={logout} title={t("dashboard.logout")} aria-label={t("dashboard.logout")}>
            <LogOut size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="admin-home-hero">
        <div>
          <h1>{t("account.admin")}</h1>
          <p>{t("adminDashboard.welcome", { name })}</p>
        </div>
      </section>

      <dl className="admin-home-metrics" aria-label={t("adminDashboard.summary")} aria-busy={!offline && !overview && !failed}>
        {metrics.map(({ key, tone, Icon }) => (
          <div key={key} className="account-card admin-home-metric">
            <span className={`admin-home-icon ${tone}`}><Icon size={21} aria-hidden="true" /></span>
            <dt>{t(`adminDashboard.${key}`)}</dt>
            <dd>{!offline && overview ? overview[key].toLocaleString(locale) : "—"}</dd>
          </div>
        ))}
      </dl>

      <div className="admin-home-columns">
        <nav className="account-card admin-home-tools" aria-labelledby="admin-tools-heading">
          <h2 id="admin-tools-heading">{t("adminDashboard.tools")}</h2>
          {[
            { to: "/admin-cuentas", label: "account.manage", detail: "adminDashboard.accountsDescription", Icon: UsersRound, tone: "peach" },
            { to: "/admin-recompensas", label: "account.editRewards", detail: "adminDashboard.rewardsDescription", Icon: Gift, tone: "lavender" },
            { to: "/perfil", label: "account.profile", detail: "adminDashboard.profileDescription", Icon: UserRound, tone: "mint" },
          ].map(({ to, label, detail, Icon, tone }) => (
            <Link key={to} to={to} className="admin-home-tool">
              <span className={`admin-home-icon ${tone}`}><Icon size={19} aria-hidden="true" /></span>
              <span><strong>{t(label)}</strong><small>{t(detail)}</small></span>
              <ArrowRight size={18} className="admin-home-arrow" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <section className="account-card admin-home-recent" aria-labelledby="admin-recent-heading">
          <div className="admin-home-section-title">
            <h2 id="admin-recent-heading">{t("adminDashboard.recentAccounts")}</h2>
            {!offline && <Link to="/admin-cuentas">{t("adminDashboard.viewAccounts")}</Link>}
          </div>
          {offline || failed || !overview ? (
            <p role={failed && !offline ? "alert" : "status"} className="admin-home-state">
              {t(offline ? "offline.requiresOnline" : failed ? "adminDashboard.loadError" : "adminDashboard.loading")}
            </p>
          ) : overview.recentAccounts.length ? (
            <ul className="admin-home-list">
              {overview.recentAccounts.map((account) => (
                <li key={account.id}>
                  <span className={`admin-home-icon ${account.role === "restaurante" ? "mint" : "peach"}`} aria-hidden="true">
                    {account.name.slice(0, 1).toLocaleUpperCase(locale)}
                  </span>
                  <span><strong>{account.name}</strong><small>{t(`account.${account.role}`)}</small></span>
                  {account.createdAt && <time dateTime={account.createdAt}>{dateFormat.format(new Date(account.createdAt))}</time>}
                </li>
              ))}
            </ul>
          ) : <p className="admin-home-state">{t("adminDashboard.noAccounts")}</p>}
          {failed && !offline && <button type="button" className="account-secondary" onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}>{t("dashboard.retry")}</button>}
        </section>
      </div>
    </main>
  );
}
