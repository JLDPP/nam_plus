import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { installApp, installPromptChanged, isStandalone } from "../services/pwa";

export default function InstallPwa() {
  const { t } = useTranslation();
  const [installed, setInstalled] = useState(isStandalone);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const onInstalled = () => {
      setInstalled(true);
      setHelp(false);
    };
    const hideHelp = () => setHelp(false);

    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(installPromptChanged, hideHelp);

    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(installPromptChanged, hideHelp);
    };
  }, []);

  if (installed) return null;

  return (
    <div className="footer-links">
      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          void installApp()
            .then((installed) => setHelp(!installed))
            .catch(() => setHelp(true));
        }}
      >
        {t("offline.install")}
      </button>

      {help && <p className="muted" role="status">{t("offline.installHelp")}</p>}
    </div>
  );
}