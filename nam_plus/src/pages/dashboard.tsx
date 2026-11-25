import { useAccount } from "../routes/protected.route";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Coins, Gift, History,
  House, LogOut, QrCode, Settings, Ticket, UserRound, Utensils,
} from "lucide-react";

import { setAuth } from "../api";
import RewardCarousel from "../components/RewardCarousel";
import { getRewards, type Reward } from "../services/reward.service";
import { getPointsBalance, getPointsHistory, type PointsTransaction } from "../services/points.service";
import "../styles/dashboard.css";
import InstallPwa from "../components/InstallPwa";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "es-MX";
  const user = useAccount();

  const [latestRewards, setLatestRewards] = useState<Reward[]>([]);
  const [latestRewardsStatus, setLatestRewardsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [latestRewardsAttempt, setLatestRewardsAttempt] = useState(0);
  const [points, setPoints] = useState<number | null>(null);
  const [pointsError, setPointsError] = useState(false);
  const [transactions, setTransactions] = useState<PointsTransaction[] | null>(null);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    const request = new AbortController();

    getRewards(request.signal).then((data) => {
      if (request.signal.aborted) return;
      setLatestRewards(data.filter((item) => item.active && item.stock > 0).slice(0, 5));
      setLatestRewardsStatus("ready");
    }).catch(() => {
      if (!request.signal.aborted) setLatestRewardsStatus("error");
    });

    return () => request.abort();
  }, [latestRewardsAttempt]);

  useEffect(() => {
    let active = true;

    const refresh = () => {
      getPointsBalance().then((balance) => {
        if (active) setPoints(balance);
      }).catch(() => {
        if (active) setPointsError(true);
      });

      getPointsHistory().then((data) => {
        if (active) setTransactions(data.slice(0, 5));
      }).catch(() => {
        if (active) setActivityError(true);
      });
    };

    refresh();
    window.addEventListener("nam-plus:points-updated", refresh);
    return () => {
      active = false;
      window.removeEventListener("nam-plus:points-updated", refresh);
    };
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
    navigate("/login", { replace: true });
  }

  const quickActions = [
    { to: "/qr", label: t("dashboard.scanQR"), Icon: QrCode, color: "peach" },
    { to: "/codigo", label: t("dashboard.enterCode"), Icon: Ticket, color: "mint" },
    { to: "/historial-canjes", label: t("dashboard.viewHistory"), Icon: History, color: "lavender" },
  ];

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-width home-header-inner">
          <Link to="/dashboard" className="home-brand">
            <span className="home-brand-icon"><Utensils size={20} aria-hidden="true" /></span>
            Ñam<span>+</span>
          </Link>
          <nav className="home-nav" aria-label={t("dashboard.navigation")}>
            <Link to="/dashboard" aria-current="page"><House size={17} aria-hidden="true" /> {t("dashboard.home")}</Link>
            <Link to="/canjes"><Gift size={17} aria-hidden="true" /> {t("dashboard.rewards")}</Link>
          </nav>
          <div className="home-account">
            <Link to="/perfil" aria-label={t("account.profile")} title={t("account.profile")}>
              <UserRound size={20} aria-hidden="true" />
            </Link>
            <Link to="/configuracion" aria-label={t("dashboard.settings")} title={t("dashboard.settings")}>
              <Settings size={20} aria-hidden="true" />
            </Link>
            <button type="button" onClick={logout} aria-label={t("dashboard.logout")} title={t("dashboard.logout")}>
              <LogOut size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="home-width home-main">
        <div className="home-intro">
          <section className="home-hero">
            <div className="home-hero-copy">
              <p className="home-greeting">{t("dashboard.hello")}, {user.name || t("dashboard.userFallback")}</p>
              <h1>{t("dashboard.heroTitle")}</h1>
              <Link to="/canjes" className="home-hero-button">
                {t("dashboard.viewRewards")} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="home-balance" aria-labelledby="home-points-title">
            <span className="home-balance-icon"><Coins size={25} aria-hidden="true" /></span>
            <h2 id="home-points-title">{t("dashboard.points")}</h2>
            <p className="home-points-value" aria-live="polite">
              {pointsError
                ? t("dashboard.pointsError")
                : points === null
                  ? t("dashboard.loadingPoints")
                  : <>{points.toLocaleString(locale)} <small>pts</small></>}
            </p>
            <p className="home-balance-hint">{t("dashboard.keepEarning")}</p>
            <Link className="home-text-link" to="/puntos">
              {t("dashboard.viewPoints")} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        </div>

        <div className="home-workspace">
          <RewardCarousel rewards={latestRewards} status={latestRewardsStatus} onRetry={() => {
            setLatestRewardsStatus("loading");
            setLatestRewardsAttempt((attempt) => attempt + 1);
          }} />

          <section className="home-actions" aria-labelledby="home-actions-title">
            <h2 id="home-actions-title">{t("dashboard.quickActions")}</h2>
            <ul>
              {quickActions.map(({ to, label, Icon, color }) => (
                <li key={to}>
                  <Link to={to}>
                    <span className={`home-action-icon ${color}`}><Icon size={21} aria-hidden="true" /></span>
                    {label}
                    <ArrowRight className="home-action-arrow" size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
                  
              <InstallPwa />
        <section className="home-activity" aria-labelledby="home-activity-title">
          <div className="home-section-heading">
            <h2 id="home-activity-title">{t("dashboard.activity")}</h2>
            <Link className="home-text-link" to="/puntos">
              {t("dashboard.viewPoints")} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          {activityError || !transactions?.length ? (
            <p className="home-activity-empty">
              {t(activityError ? "dashboard.activityError" : transactions ? "dashboard.noActivity" : "dashboard.loadingActivity")}
            </p>
          ) : (
            <ul className="home-activity-list">
              {transactions.map((transaction) => {
                const isCredit = transaction.type === "earn" ||
                  (transaction.type === "adjustment" && transaction.points > 0);
                const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                const label = transaction.type === "earn" ? "earn" :
                  transaction.type === "redeem" ? "redeemActivity" : "adjustment";

                return (
                  <li key={transaction._id}>
                    <span className={`home-action-icon ${isCredit ? "mint" : "peach"}`}><Icon size={19} aria-hidden="true" /></span>
                    <div>
                      <strong>{transaction.description || t(`dashboard.${label}`)}</strong>
                      <time dateTime={transaction.createdAt}>
                        {new Date(transaction.createdAt).toLocaleDateString(locale, {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </time>
                    </div>
                    <strong className={isCredit ? "home-credit" : ""}>
                      {isCredit ? "+" : "−"}{Math.abs(transaction.points).toLocaleString(locale)} pts
                    </strong>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="home-actions" aria-labelledby="home-legal-title">
          <h2 id="home-legal-title">Documentos legales</h2>
          <ul>
            {[
              ["Terminos y Condiciones (1) (1).pdf", "Términos y condiciones"],
              ["Aviso de Privacidad (1).pdf", "Aviso de privacidad"],
              ["POLÍTICAS DE USO Y SERVICIO (1).pdf", "Políticas de uso y servicio"],
            ].map(([archivo, titulo]) => (
              <li key={archivo}>
                <a
                  href={`/legal/${encodeURIComponent(archivo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="home-action-icon peach" aria-hidden="true">PDF</span>
                  <span>{titulo} (PDF)</span>
                  <ArrowUpRight className="home-action-arrow" size={18} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}