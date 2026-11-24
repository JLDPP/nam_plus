import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { installApp, installPromptChanged, isStandalone } from "../services/pwa";

export default function InstallPwa() {
  const { t } = useTranslation();
  const [installed, setInstalled] = useState(isStandalone);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const done = () => { setInstalled(true); setHelp(false); };
    const update = () => setHelp(false);
    window.addEventListener("appinstalled", done);
    window.addEventListener(installPromptChanged, update);
    return () => {
      window.removeEventListener("appinstalled", done);
      window.removeEventListener(installPromptChanged, update);
    };
  }, []);

  if (installed) return null;
  return (
    <section className="settings-card">
      <div className="pwa-install">
        <h2>{t("offline.desktopApp")}</h2>
        {help && <p role="status">{t("offline.installHelp")}</p>}
      </div>
      <button type="button" className="option-btn" onClick={() => {
        void installApp().then((prompted) => setHelp(!prompted)).catch(() => setHelp(true));
      }}>{t("offline.install")}</button>
    </section>
  );
}
