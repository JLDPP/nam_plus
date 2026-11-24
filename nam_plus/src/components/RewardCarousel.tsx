import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { rewardImageUrl, type Reward } from "../services/reward.service";

type Props = {
  rewards: Reward[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
};

export default function RewardCarousel({ rewards, status, onRetry }: Props) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const count = rewards.length;
  const selected = Math.min(index, Math.max(0, count - 1));
  const reward = rewards[selected];

  function move(step: number) {
    setIndex((current) => (Math.min(current, count - 1) + step + count) % count);
  }

  return (
    <section className="home-promotions" aria-labelledby="home-reward-title">
      <div className="home-section-heading">
        <h2 id="home-reward-title">{t("dashboard.latestRewards")}</h2>
        <Link className="home-text-link" to="/canjes">
          {t("dashboard.allRewards")} <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>

      {status === "error" ? (
        <div className="home-promo-empty">
          <p role="alert">{t("dashboard.rewardsError")}</p>
          <button type="button" className="home-outline-button" onClick={onRetry}>
            {t("dashboard.retry")}
          </button>
        </div>
      ) : status === "loading" || !reward ? (
        <div className="home-promo-empty" role="status">
          <Gift size={26} aria-hidden="true" />
          <p>{t(status === "loading" ? "dashboard.loadingRewards" : "dashboard.noRewards")}</p>
        </div>
      ) : (
        <>
          <div aria-live="polite">
            <article className="home-promo-slide" key={reward._id}>
              <div className="home-promo-media">
                <Gift size={42} aria-hidden="true" />
                {reward.imageUrl && (
                  <img src={rewardImageUrl(reward.imageUrl)} alt="" onError={(event) => {
                    event.currentTarget.hidden = true;
                  }} />
                )}
              </div>
              <div className="home-promo-copy">
                <p>{reward.restaurantName}</p>
                <h3>{reward.name}</h3>
                <strong>{reward.pointsCost.toLocaleString(i18n.resolvedLanguage === "en" ? "en-US" : "es-MX")} pts</strong>
              </div>
            </article>
          </div>

          {count > 1 && (
            <div className="home-carousel-controls">
              <button type="button" onClick={() => move(-1)} aria-label={t("dashboard.previousReward")}>
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <div className="home-carousel-dots" role="group" aria-label={t("dashboard.latestRewards")}>
                {rewards.map((item, position) => (
                  <button
                    key={item._id}
                    type="button"
                    aria-label={t("dashboard.rewardPosition", { position: position + 1, count })}
                    aria-current={selected === position ? "true" : undefined}
                    onClick={() => setIndex(position)}
                  />
                ))}
              </div>
              <button type="button" onClick={() => move(1)} aria-label={t("dashboard.nextReward")}>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
