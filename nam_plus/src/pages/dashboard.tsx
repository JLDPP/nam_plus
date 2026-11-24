import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Coins, Gift, History,
  House, LogOut, QrCode, Settings, Tag, Ticket, Utensils,
} from "lucide-react";

import { setAuth } from "../api";
import PromotionCarousel from "../components/PromotionCarousel";
import { getPromotions, isPromotionAvailable, type Promotion } from "../services/promotion.service";
import { getPointsBalance, getPointsHistory, type PointsTransaction } from "../services/points.service";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "es-MX";
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionsStatus, setPromotionsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [promotionsAttempt, setPromotionsAttempt] = useState(0);
  const [points, setPoints] = useState<number | null>(null);
  const [pointsError, setPointsError] = useState(false);
  const [transactions, setTransactions] = useState<PointsTransaction[] | null>(null);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    const request = new AbortController();

    getPromotions(request.signal).then((data) => {
      if (request.signal.aborted) return;
      const now = new Date();
      // The API returns newest first.
      setPromotions(data.filter((item) =>
        isPromotionAvailable(item, now) && (item.stock == null || item.stock > 0)
      ).slice(0, 5));
      setPromotionsStatus("ready");
    }).catch(() => {
      if (!request.signal.aborted) setPromotionsStatus("error");
    });

    return () => request.abort();
  }, [promotionsAttempt]);

  useEffect(() => {
    let active = true;

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

    return () => { active = false; };
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
            <Link to="/promociones"><Tag size={17} aria-hidden="true" /> {t("dashboard.promotionsNav")}</Link>
            <Link to="/canjes"><Gift size={17} aria-hidden="true" /> {t("dashboard.rewards")}</Link>
          </nav>
          <div className="home-account">
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
              <Link to="/promociones" className="home-hero-button">
                {t("dashboard.explorePromotions")} <ArrowRight size={17} aria-hidden="true" />
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
          <PromotionCarousel promotions={promotions} status={promotionsStatus} onRetry={() => {
            setPromotionsStatus("loading");
            setPromotionsAttempt((attempt) => attempt + 1);
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
      </main>
    </div>
  );
}
