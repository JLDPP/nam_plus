import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { isAxiosError } from "axios";
import OfflineStatus from "../components/OfflineStatus";
import { restoreSession, saveSession } from "../services/offlineStore";
import { useTranslation } from "react-i18next";
import { cacheAccount, getOwnAccount, type Account, type Role } from "../services/account.service";

const AccountContext = createContext<Account | null>(null);
const OfflineContext = createContext(false);
export const useOffline = () => useContext(OfflineContext);

export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("Se requiere una sesión verificada.");
  return account;
}

export default function ProtectedRoute({ children, roles, onlineOnly }: {
  children: ReactNode;
  roles?: Role[];
  onlineOnly?: boolean;
}) {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const [session, setSession] = useState<{ token: string; account: Account | null; offline?: boolean; savedAt?: number; expiresAt?: number } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    async function verify() {
      try {
        const account = await getOwnAccount(controller.signal);
        if (controller.signal.aborted || !token || localStorage.getItem("token") !== token) return;
        const stored = await saveSession(token, account).catch(() => undefined);
        if (controller.signal.aborted || localStorage.getItem("token") !== token) return;
        cacheAccount(account);
        setSession({ token, account, savedAt: stored?.savedAt, expiresAt: stored?.expiresAt });
      } catch (error) {
        if (controller.signal.aborted || !token || localStorage.getItem("token") !== token) return;
        const networkError = isAxiosError(error) && (!error.response || [502, 503, 504].includes(error.response.status));
        const stored = networkError ? await restoreSession(token).catch(() => undefined) : undefined;
        if (controller.signal.aborted || localStorage.getItem("token") !== token) return;
        if (stored) cacheAccount(stored.account);
        setSession({ token, account: stored?.account ?? null, offline: networkError,
          savedAt: stored?.savedAt, expiresAt: stored?.expiresAt });
      }
    }

    const reconnect = () => setAttempt((value) => value + 1);
    const disconnect = () => setSession((current) => current ? { ...current, offline: true } : current);
    // Cuando una pantalla ya estaba abierta se conserva su formulario al reconectar.
    void verify();
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", disconnect);
    return () => {
      controller.abort();
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", disconnect);
    };
  }, [token, attempt]);

  useEffect(() => {
    if (!session?.offline) return;
    const interval = window.setInterval(() => {
      if (navigator.onLine) setAttempt((value) => value + 1);
    }, 17_000);
    return () => window.clearInterval(interval);
  }, [session?.offline]);

  useEffect(() => {
    if (!session?.expiresAt || !session.offline) return;
    const timeout = window.setTimeout(() => setSession({ token: session.token, account: null, offline: true }), Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [session?.expiresAt, session?.offline, session?.token]);

  if (!token) return <Navigate to="/login" replace />;
  if (session?.token !== token) return <p className="account-session" role="status">{t("account.checking")}</p>;
  if (!session.account) return (
    <div className="account-session">
      <p role="alert">{t("account.sessionError")}</p>
      <button className="btn primary" type="button" onClick={() => {
        setSession(null);
        setAttempt((value) => value + 1);
      }}>{t("dashboard.retry")}</button>
    </div>
  );
  if (roles && !roles.includes(session.account.role)) return <Navigate to="/dashboard" replace />;
  const offline = session.offline === true;
  return (
    <AccountContext.Provider value={session.account}>
      <OfflineContext.Provider value={offline}>
        <OfflineStatus account={session.account} offline={offline} savedAt={session.savedAt} />
        {offline && (onlineOnly || (session.account.role === "admin" && roles)) ? (
          <main className="account-session">
            <p role="status">{t("offline.requiresOnline")}</p>
            <Link to="/dashboard">{t("common.back")}</Link>
          </main>
        ) : children}
      </OfflineContext.Provider>
    </AccountContext.Provider>
  );
}
