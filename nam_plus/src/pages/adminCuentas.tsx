import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAccount } from "../routes/protected.route";
import { api } from "../api";
import { getAccountError, type Account } from "../services/account.service";
import "../styles/accounts.css";

type Editor = { mode: "create" } | { mode: "edit" | "points"; account: Account };

export default function AdminCuentas() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [role, setRole] = useState<"cliente" | "restaurante">("cliente");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const { id: ownId } = useAccount();
  const account = editor && "account" in editor ? editor.account : null;
  const search = query.trim().toLowerCase();

  useEffect(() => {
    const controller = new AbortController();
    api.get<Account[]>("/api/auth/accounts", { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setAccounts(data);
    }).catch(() => {
      if (!controller.signal.aborted) setError(t("account.error"));
    });
    return () => controller.abort();
  }, [t]);

  function open(next: Editor) {
    setEditor(next);
    setRole("cliente");
    setError("");
    setSaved(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    const form = new FormData(event.currentTarget);
    const text = (field: string) => String(form.get(field) ?? "");
    const profile = { name: text("name"), email: text("email") };
    setSaving(true);
    setError("");
    try {
      let updated: Account;
      if (editor.mode === "create") {
        updated = (await api.post<Account>("/api/auth/accounts", {
          ...profile, role, password: text("password"),
          ...(role === "restaurante" ? { restaurantName: text("restaurantName") } : {}),
        })).data;
      } else if (editor.mode === "edit") {
        updated = (await api.patch<Account>(`/api/auth/accounts/${editor.account.id}`, profile)).data;
      } else {
        updated = (await api.post<Account>(`/api/auth/accounts/${editor.account.id}/points`, {
          points: Number(text("points")), reason: text("reason"),
        })).data;
      }
      setAccounts((previous) => [...(previous ?? []).filter((item) => item.id !== updated.id), updated]
        .sort((left, right) => left.name.localeCompare(right.name)));
      setEditor(null);
      setSaved(true);
    } catch (cause) {
      setError(getAccountError(cause, t("account.error")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="account-page">
      <Link to="/dashboard">{t("common.back")}</Link>
      <header className="account-heading">
        <h1>{t("account.manage")}</h1>
        <button className="btn primary" disabled={!accounts || saving} onClick={() => open({ mode: "create" })}>{t("account.create")}</button>
      </header>
      {saved && <p role="status">{t("account.saved")}</p>}

      {editor && (
        <form className="account-card account-editor" onSubmit={save} key={`${editor.mode}-${account?.id ?? ""}`}>
          <h2>{t(`account.${editor.mode === "points" ? "adjust" : editor.mode}`)}{account ? ` · ${account.name}` : ""}</h2>
          <fieldset className="account-fields" disabled={saving}>
            {editor.mode === "points" ? (
              <>
                <label>{t("account.delta")}<input name="points" type="number" step="1" required /></label>
                <label>{t("account.reason")}<input name="reason" maxLength={240} required /></label>
              </>
            ) : (
              <>
                <label>{t("account.name")}<input name="name" defaultValue={account?.name} maxLength={120} required /></label>
                <label>{t("account.email")}<input name="email" type="email" defaultValue={account?.email} required /></label>
                {editor.mode === "create" && (
                  <>
                    <label>{t("account.role")}<select value={role} onChange={(event) => setRole(event.target.value === "restaurante" ? "restaurante" : "cliente")}>
                      <option value="cliente">{t("account.cliente")}</option>
                      <option value="restaurante">{t("account.restaurante")}</option>
                    </select></label>
                    <label>{t("account.initialPassword")}<input name="password" type="password" autoComplete="new-password" minLength={6} required /></label>
                    {role === "restaurante" && <label>{t("account.restaurantName")}<input name="restaurantName" maxLength={120} required /></label>}
                  </>
                )}
              </>
            )}
          </fieldset>
          {error && <p role="alert" className="account-error">{error}</p>}
          <div className="account-actions">
            <button className="btn primary" disabled={saving}>{t(saving ? "account.saving" : "account.save")}</button>
            <button type="button" className="account-secondary" disabled={saving} onClick={() => { setEditor(null); setError(""); }}>{t("account.cancel")}</button>
          </div>
        </form>
      )}

      {!editor && error && <p role="alert" className="account-error">{error}</p>}
      {!accounts && !error && <p role="status">{t("account.checking")}</p>}
      {accounts && (
        <>
          <label className="account-search">{t("account.search")}
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <ul className="account-grid account-list">
            {accounts.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(search)).map((item) => (
              <li className="account-card" key={item.id}>
                <h2>{item.name}</h2>
                <p>{item.email}</p>
                <p>{t(`account.${item.role === "admin" ? "adminRole" : item.role}`)} · {item.pointsBalance.toLocaleString()} pts</p>
                {item.id === ownId ? <Link to="/perfil">{t("account.profile")}</Link> : (
                  <div className="account-actions">
                    <button className="account-secondary" disabled={saving} onClick={() => open({ mode: "edit", account: item })}>{t("account.edit")}</button>
                    <button className="account-secondary" disabled={saving} onClick={() => open({ mode: "points", account: item })}>{t("account.adjust")}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
