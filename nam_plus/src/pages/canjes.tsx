import { useOffline } from "../routes/protected.route";
import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRewards, rewardImageUrl, type Reward } from "../services/reward.service";
import { redeemReward } from "../services/redemption.service";
import { getPointsBalance } from "../services/points.service";
import "../styles/canjes.css";

export default function Canjes() {
  const offline = useOffline();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "es-MX";
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    getRewards().then((data) => {
      if (active) setRewards(data);
    }).catch(() => {
      if (active) setLoadError(true);
    });
    getPointsBalance().then((balance) => {
      if (active) setPoints(balance);
    }).catch(() => {
      if (active) setError(t("rewards.balanceError"));
    });
    return () => { active = false; };
  }, [t]);

  async function redeem(reward: Reward) {
    if (offline || submitting.current || uncertain || points === null || points < reward.pointsCost || reward.stock < 1) return;
    if (!window.confirm(t("rewards.confirmRedeem", { name: reward.name, points: reward.pointsCost }))) return;

    submitting.current = true;
    setPending(reward._id);
    setError("");
    setMessage("");

    try {
      const receipt = await redeemReward(reward._id, reward.pointsCost);
      const [updatedRewards, updatedBalance] = await Promise.allSettled([
        getRewards(),
        Number.isSafeInteger(receipt.pointsBalance)
          ? Promise.resolve(receipt.pointsBalance)
          : getPointsBalance(),
      ]);
      if (updatedRewards.status === "fulfilled") {
        setRewards(updatedRewards.value);
      } else {
        setRewards((current) => current?.map((item) =>
          item._id === reward._id ? { ...item, stock: item.stock - 1 } : item
        ) ?? null);
      }
      setPoints(updatedBalance.status === "fulfilled" ? updatedBalance.value : null);
      setMessage(t("rewards.redeemSuccess", { name: reward.name }));
      if (updatedRewards.status === "rejected" || updatedBalance.status === "rejected") {
        setError(t("rewards.refreshError"));
      }
    } catch (cause) {
      const response = isAxiosError<{ message?: string }>(cause) ? cause.response : undefined;
      if (response && response.status >= 400 && response.status < 500) {
        setError(response.data?.message || t("rewards.redeemError"));
        const [catalog, balance] = await Promise.allSettled([getRewards(), getPointsBalance()]);
        if (catalog.status === "fulfilled") setRewards(catalog.value);
        setPoints(balance.status === "fulfilled" ? balance.value : null);
      } else {
        setUncertain(true);
        setError(t("rewards.uncertain"));
      }
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  return (
    <div className="redeem-page">
      <header className="redeem-header">
        <Link className="redeem-back-btn" to="/dashboard">← {t("common.back")}</Link>
        <h1>{t("rewards.title")}</h1>
        <p>{t("rewards.subtitle")}</p>
      </header>

      <main className="redeem-container">
        <section className="redeem-balance-card">
          <h2>{t("rewards.availablePoints")}</h2>
          <div className="redeem-balance-total" aria-live="polite">
            {points === null ? t("rewards.unavailable") : `${points.toLocaleString(locale)} pts`}
          </div>
          <p><Link to="/historial-canjes">{t("rewards.history")}</Link></p>
        </section>

        {message && <p className="redeem-success" role="status">{message}</p>}
        {error && <p className="redeem-error" role="alert">{error}</p>}

        {loadError ? (
          <p className="redeem-error" role="alert">{t("rewards.loadError")}</p>
        ) : rewards === null ? (
          <p className="redeem-empty" role="status">{t("rewards.loading")}</p>
        ) : rewards.length === 0 ? (
          <div className="redeem-empty">
            <h2>{t("rewards.emptyTitle")}</h2>
            <p>{t("rewards.emptyDescription")}</p>
          </div>
        ) : (
          <section className="reward-grid" aria-label={t("rewards.title")}>
            {rewards.map((reward) => {
              const canRedeem = points !== null && points >= reward.pointsCost && reward.stock > 0;
              return (
                <article className="reward-card" key={reward._id}>
                  <div className="reward-image-placeholder" aria-hidden="true">
                    <Gift size={34} />
                    {reward.imageUrl && <img className="reward-image" src={rewardImageUrl(reward.imageUrl)} alt="" loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true; }} />}
                  </div>
                  <div className="reward-content">
                    <span className="reward-restaurant">{reward.restaurantName}</span>
                    <h2>{reward.name}</h2>
                    {reward.description && <p className="reward-description">{reward.description}</p>}
                    <div className="reward-footer">
                      <span className="reward-cost">{reward.pointsCost.toLocaleString(locale)} pts</span>
                      <span className="reward-stock">{reward.stock > 0
                        ? t("rewards.availableStock", { count: reward.stock })
                        : t("rewards.outOfStock")}</span>
                    </div>
                    <button type="button" className="reward-redeem-btn"
                      disabled={offline || !canRedeem || pending !== null || uncertain}
                      onClick={() => void redeem(reward)}>
                      {t(offline ? "offline.requiresOnline" : pending === reward._id ? "rewards.processing" : reward.stock < 1
                        ? "rewards.outOfStock" : points === null ? "rewards.balanceUnavailable"
                        : points < reward.pointsCost ? "rewards.insufficientShort" : "rewards.redeemButton")}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
