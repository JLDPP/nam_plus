interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

let installPrompt: InstallPrompt | undefined;
export const installPromptChanged = "nam-plus:install-prompt";
export const isStandalone = () => matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function registerPwa() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as InstallPrompt;
    window.dispatchEvent(new Event(installPromptChanged));
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = undefined;
    window.dispatchEvent(new Event(installPromptChanged));
  });
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.error("No se pudo registrar el modo sin conexión:", error.name);
  });
}

export async function installApp() {
  if (!installPrompt) return false;
  const prompt = installPrompt;
  installPrompt = undefined;
  const choice = await prompt.prompt();
  return choice.outcome === "accepted";
}
