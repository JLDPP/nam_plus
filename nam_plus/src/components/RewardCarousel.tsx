import { useRef, useState, type PointerEvent } from "react";
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
  const [{ index, direction }, setSlide] = useState({ index: 0, direction: 0 });
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const count = rewards.length;
  const selected = Math.min(index, Math.max(0, count - 1));
  const reward = rewards[selected];

  function move(step: number) {
    if (count < 2) return;
    setSlide((current) => ({
      index: (Math.min(current.index, count - 1) + step + count) % count,
      direction: step,
    }));
  }

  function startSwipe(event: PointerEvent) {
    if (count < 2 || !event.isPrimary || event.pointerType === "mouse") return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function finishSwipe(event: PointerEvent) {
    if (gesture.current?.id !== event.pointerId) return;
    const { x, y } = gesture.current;
    gesture.current = null;
    const horizontal = event.clientX - x;
    const vertical = event.clientY - y;
    if (Math.abs(horizontal) >= 36 && Math.abs(horizontal) > Math.abs(vertical) * 1.35) {
      move(horizontal < 0 ? 1 : -1);
    }
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
          <div className="home-carousel-viewport" aria-live="polite"
            onPointerDown={startSwipe} onPointerUp={finishSwipe}
            onPointerCancel={() => { gesture.current = null; }}>
            <article className="home-promo-slide" key={reward._id}
              data-direction={direction === 0 ? undefined : direction > 0 ? "next" : "previous"}>
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
            <div className="home-carousel-controls" onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              move(event.key === "ArrowRight" ? 1 : -1);
            }}>
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
                    onClick={() => setSlide({ index: position, direction: Math.sign(position - selected) })}
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
