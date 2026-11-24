import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Promotion } from "../services/promotion.service";

type Props = {
  promotions: Promotion[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
};

export default function PromotionCarousel({ promotions, status, onRetry }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const count = promotions.length;
  const selected = Math.min(index, Math.max(0, count - 1));
  const promotion = promotions[selected];

  function move(step: number) {
    setIndex((current) => (Math.min(current, count - 1) + step + count) % count);
  }

  return (
    <section className="home-promotions" aria-labelledby="home-promotion-title">
      <div className="home-section-heading">
        <h2 id="home-promotion-title">{t("dashboard.promotions")}</h2>
        <Link className="home-text-link" to="/promociones">
          {t("dashboard.allPromotions")} <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>

      {status === "error" ? (
        <div className="home-promo-empty">
          <p role="alert">{t("dashboard.promotionsError")}</p>
          <button type="button" className="home-outline-button" onClick={onRetry}>
            {t("dashboard.retry")}
          </button>
        </div>
      ) : status === "loading" || !promotion ? (
        <div className="home-promo-empty" role="status">
          <Utensils size={26} aria-hidden="true" />
          <p>{t(status === "loading" ? "dashboard.loadingPromotions" : "dashboard.noPromotions")}</p>
        </div>
      ) : (
        <>
          <div aria-live="polite">
            <article className="home-promo-slide" key={promotion._id}>
              <div className="home-promo-media">
                <Utensils size={42} aria-hidden="true" />
                {promotion.imageUrl && (
                  <img src={promotion.imageUrl} alt="" onError={(event) => {
                    event.currentTarget.hidden = true;
                  }} />
                )}
              </div>
              <div className="home-promo-copy">
                <p>{promotion.restaurantName}</p>
                <h3>{promotion.title}</h3>
                <Link className="home-text-link" to={`/promociones/${promotion._id}`}>
                  {t("dashboard.promotionDetails")} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>

          {count > 1 && (
            <div className="home-carousel-controls">
              <button type="button" onClick={() => move(-1)} aria-label={t("dashboard.previousPromotion")}>
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <div className="home-carousel-dots" role="group" aria-label={t("dashboard.promotions")}>
                {promotions.map((item, position) => (
                  <button
                    key={item._id}
                    type="button"
                    aria-label={t("dashboard.promotionPosition", { position: position + 1, count })}
                    aria-current={selected === position ? "true" : undefined}
                    onClick={() => setIndex(position)}
                  />
                ))}
              </div>
              <button type="button" onClick={() => move(1)} aria-label={t("dashboard.nextPromotion")}>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
