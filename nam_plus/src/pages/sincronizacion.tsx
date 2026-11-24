import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccount, useOffline } from "../routes/protected.route";
import { queueChanged, syncQueue } from "../services/offlineQueue";
import { listOperations, removeOperation, type Operation } from "../services/offlineStore";
import "../styles/accounts.css";

export default function Sincronizacion() {
  const { t, i18n } = useTranslation();
  const account = useAccount();
  const offline = useOffline();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => listOperations(account.id).then((items) => {
      if (active) setOperations(items.reverse());
    }).catch(() => { if (active) setError(true); });
    void load();
    window.addEventListener(queueChanged, load);
    return () => {
      active = false;
      window.removeEventListener(queueChanged, load);
    };
  }, [account.id]);

  return (
    <main className="account-page">
      <Link to="/dashboard">{t("common.back")}</Link>
      <header className="account-heading">
        <h1>{t("offline.queue")}</h1>
        <button className="btn primary" disabled={offline || busy} onClick={() => {
          setBusy(true);
          setError(false);
          void syncQueue(account).catch(() => setError(true)).finally(() => setBusy(false));
        }}>{t("offline.sync")}</button>
      </header>
      {error && <p role="alert" className="account-error">{t("offline.syncError")}</p>}
      {!operations.length && <p>{t("offline.empty")}</p>}
      <ul className="account-grid account-list">
        {operations.map((operation) => (
          <li key={operation.id} className="account-card">
            <h2>{t(`offline.${operation.kind}`)}</h2>
            <p>{new Date(operation.createdAt).toLocaleString(i18n.resolvedLanguage)}</p>
            <p>{operation.kind === "purchase"
              ? `${operation.body.customerEmail} · ${operation.body.amountMXN.toLocaleString(i18n.resolvedLanguage, { style: "currency", currency: "MXN" })}`
              : `…${operation.body.code.slice(-6)}`}</p>
            <strong>{t(`offline.${operation.status}`)}</strong>
            {operation.status === "rejected" && <p role="status">{operation.message}</p>}
            {operation.status === "synced" && operation.result && (
              <p>{operation.result.emailSent ? t("offline.emailSent")
                : operation.result.emailPending ? t("offline.emailPending")
                : t(`offline.emailFailure.${operation.result.emailError || "unknown"}`, { defaultValue: t("offline.emailUnknown") })}
                <br /><code>{operation.result.code}</code>
              </p>
            )}
            {operation.status !== "pending" && (
              <button className="account-secondary" onClick={() => {
                void removeOperation(account.id, operation.id).then(() => {
                  window.dispatchEvent(new Event(queueChanged));
                }).catch(() => setError(true));
              }}>{t("offline.dismiss")}</button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
