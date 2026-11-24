import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cacheAccount, getOwnAccount, type Account, type Role } from "../services/account.service";

const AccountContext = createContext<Account | null>(null);

export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("Se requiere una sesión verificada.");
  return account;
}

export default function ProtectedRoute({ children, roles }: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const [session, setSession] = useState<{ token: string; account: Account | null } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getOwnAccount(controller.signal).then((account) => {
      if (controller.signal.aborted) return;
      cacheAccount(account);
      setSession({ token, account });
    }).catch(() => {
      if (!controller.signal.aborted) setSession({ token, account: null });
    });
    return () => controller.abort();
  }, [token, attempt]);

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
  return <AccountContext.Provider value={session.account}>{children}</AccountContext.Provider>;
}
