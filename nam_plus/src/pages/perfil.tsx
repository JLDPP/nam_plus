import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAccount } from "../routes/protected.route";
import { api } from "../api";
import { cacheAccount, getAccountError, type Account } from "../services/account.service";
import "../styles/accounts.css";

export default function Perfil() {
  const { t } = useTranslation();
  const account = useAccount();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaved(false);
    setError("");
    if (newPassword !== confirmation) {
      setError(t("account.passwordMismatch"));
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch<{ user: Account; token?: string }>("/api/auth/me", {
        name, email, ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      cacheAccount(data.user, data.token);
      setName(data.user.name);
      setEmail(data.user.email);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setSaved(true);
    } catch (cause) {
      setError(getAccountError(cause, t("account.error")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="account-page account-narrow">
      <Link to="/dashboard">{t("common.back")}</Link>
      <h1>{t("account.profile")}</h1>
      <form className="account-card" onSubmit={save}>
        <fieldset disabled={saving} className="account-fields">
          <label>{t("account.name")}<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} required /></label>
          <label>{t("account.email")}<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label>
        </fieldset>
        <fieldset disabled={saving} className="account-fields">
          <legend>{t("account.changePassword")}</legend>
          <label>{t("account.currentPassword")}<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required={Boolean(newPassword)} /></label>
          <label>{t("account.newPassword")}<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={6} required={Boolean(currentPassword)} /></label>
          <label>{t("account.confirmPassword")}<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required={Boolean(newPassword)} /></label>
        </fieldset>
        {error && <p role="alert" className="account-error">{error}</p>}
        {saved && <p role="status">{t("account.saved")}</p>}
        <button className="btn primary" disabled={saving}>{t(saving ? "account.saving" : "account.save")}</button>
      </form>
    </main>
  );
}
