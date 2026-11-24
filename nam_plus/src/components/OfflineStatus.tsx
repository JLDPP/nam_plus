import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Account } from "../services/account.service";
import { queueChanged, syncQueue } from "../services/offlineQueue";
import { listOperations } from "../services/offlineStore";
import "../styles/offline.css";

export default function OfflineStatus({ account, offline, savedAt }: {
  account: Account; offline: boolean; savedAt?: number;
}) {
  const { t, i18n } = useTranslation();
  const [pending, setPending] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [snapshotAt, setSnapshotAt] = useState<number | null>(null);
  const queueAllowed = account.role !== "admin";

  useEffect(() => {
    if (!queueAllowed) return;
    let active = true;
    const refresh = () => {
      listOperations(account.id).then((items) => {
        if (active) setPending(items.filter((item) => item.status === "pending").length);
      }).catch(() => {});
    };
    const sync = () => {
      if (!offline) void syncQueue(account).catch(() => {});
    };
    refresh();
    sync();
    window.addEventListener(queueChanged, refresh);
    const interval = window.setInterval(sync, 15_000);
    return () => {
      active = false;
      window.removeEventListener(queueChanged, refresh);
      window.clearInterval(interval);
    };
  }, [account, offline, queueAllowed]);

  useEffect(() => {
    const onSnapshot = (event: Event) => {
      const date = (event as CustomEvent<number>).detail;
      setSnapshotAt((previous) => previous === null ? date : Math.min(previous, date));
      setUnavailable(true);
    };
    window.addEventListener("nam-plus:snapshot-used", onSnapshot);
    return () => window.removeEventListener("nam-plus:snapshot-used", onSnapshot);
  }, []);

  const last = snapshotAt ?? savedAt;
  if (!offline && !unavailable && !queueAllowed) return null;

  return (
    <aside className="offline-status">
      <span role="status">
        {offline || unavailable
          ? t(last ? "offline.lastSaved" : "offline.disconnected",
            { date: last ? new Date(last).toLocaleString(i18n.resolvedLanguage) : "" })
          : t("offline.pendingCount", { count: pending })}
      </span>
      {queueAllowed && <Link to="/sincronizacion">{t("offline.queue")}</Link>}
    </aside>
  );
}
