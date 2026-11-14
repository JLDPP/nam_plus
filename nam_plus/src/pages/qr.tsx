
/*
  ARCHIVO: qr.tsx

  FUNCIÓN:
  Escanear tickets QR y validar puntos en Ñam+.

  FUNCIONES CONSERVADAS:
  - Inicialización segura de la cámara.
  - Prevención de cámaras duplicadas.
  - Limpieza del lector al salir.
  - Detección automática del código QR.
  - Validación con redeemCode().
  - Botones Continuar y Escanear otro.
  - Diseño actual del escáner.

  MEJORA:
  - Traducciones español/inglés con i18next.
*/

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Html5Qrcode } from "html5-qrcode";

import { redeemCode } from "../services/redeem.service";
import "../styles/qr.css";

export default function Qr() {
  const { t } = useTranslation();

  const [messageKey, setMessageKey] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // ==========================================
  // INICIAR CÁMARA Y ESCÁNER QR
  // ==========================================

  useEffect(() => {
    let cancelled = false;
    let detected = false;
    let scanner: Html5Qrcode | null = null;
    let startPromise: Promise<null> | null = null;

    async function stopScanner() {
      if (scanner?.isScanning) {
        try {
          await scanner.stop();
        } catch (error) {
          console.warn(
            "No se pudo detener el escáner:",
            error
          );
        }
      }
    }

    async function startScanner() {
      if (cancelled) return;

      scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      try {
        startPromise = scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,

            qrbox: (width, height) => {
              const size = Math.max(
                50,
                Math.min(
                  250,
                  Math.floor(
                    Math.min(width, height) * 0.7
                  )
                )
              );

              return {
                width: size,
                height: size,
              };
            },
          },

          async (decodedText) => {
            if (cancelled || detected) return;

            detected = true;

            setScannedCode(decodedText);
            setServerMessage("");
            setMessageKey("qr.detectedSuccess");

            console.log(
              "Código QR detectado:",
              decodedText
            );

            await stopScanner();
          },

          () => {
            // Ignorar errores normales de lectura.
          }
        );

        await startPromise;

        // Si el componente salió durante
        // la inicialización, liberar la cámara.
        if (cancelled) {
          await stopScanner();
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Error al iniciar la cámara:",
            error
          );

          setServerMessage("");
          setMessageKey("qr.cameraError");
        }
      }
    }

    // Conservamos la protección contra
    // la doble inicialización en StrictMode.
    const timer = window.setTimeout(() => {
      void startScanner();
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);

      void (async () => {
        try {
          await startPromise;
        } catch {
          // El inicio de la cámara pudo fallar.
        }

        await stopScanner();

        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
      })();
    };
  }, []);

  // ==========================================
  // VALIDAR CÓDIGO DETECTADO
  // ==========================================

  async function processCode() {
    if (!scannedCode) {
      setServerMessage("");
      setMessageKey("qr.scanFirst");
      return;
    }

    setLoading(true);
    setMessageKey("");
    setServerMessage("");

    try {
      // Conservamos el servicio existente.
      const result = await redeemCode(scannedCode);

      // Se conserva la respuesta real del backend.
      setServerMessage(result.message);

      console.log("Resultado del QR:", result);
    } catch (error) {
      console.error(
        "Error procesando el QR:",
        error
      );

      setMessageKey("qr.validationError");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // ACCIONES
  // ==========================================

  function scanAgain() {
    window.location.reload();
  }

  function goBack() {
    window.location.href = "/dashboard";
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <main className="qr-page">
      <div className="qr-container">

        <header className="qr-header">
          <div>
            <span className="qr-eyebrow">
              {t("qr.brand")}
            </span>

            <h1>{t("qr.title")}</h1>

            <p>{t("qr.subtitle")}</p>
          </div>

          <button
            type="button"
            className="qr-back-btn"
            onClick={goBack}
          >
            ← {t("common.back")}
          </button>
        </header>

        <section className="qr-scanner-card">

          <div className="qr-card-heading">
            <div className="qr-camera-icon">
              ◈
            </div>

            <div>
              <h2>{t("qr.scanTicket")}</h2>

              <p>
                {t("qr.cameraInstructions")}
              </p>
            </div>
          </div>

          <div className="qr-reader-wrapper">
            <div id="qr-reader"></div>
          </div>

          <div className="qr-instructions">
            <span className="qr-instructions-dot"></span>

            {scannedCode
              ? t("qr.detected")
              : t("qr.waiting")}
          </div>

          <p className="qr-help-text">
            {t("qr.help")}
          </p>

        </section>

        {scannedCode && (
          <section className="qr-result">
            <span className="qr-result-label">
              {t("qr.detected")}
            </span>

            <strong>{scannedCode}</strong>
          </section>
        )}

        <div className="qr-actions">
          {scannedCode && (
            <>
              <button
                type="button"
                className="qr-primary-btn"
                onClick={processCode}
                disabled={loading}
              >
                {loading
                  ? t("qr.validating")
                  : t("common.continue")}
              </button>

              <button
                type="button"
                className="qr-secondary-btn"
                onClick={scanAgain}
                disabled={loading}
              >
                {t("qr.scanAgain")}
              </button>
            </>
          )}
        </div>

        {(messageKey || serverMessage) && (
          <div className="qr-message">
            {messageKey
              ? t(messageKey)
              : serverMessage}
          </div>
        )}

        <div className="qr-footer">
          <span>🔒</span>

          <p>{t("qr.security")}</p>
        </div>

      </div>
    </main>
  );
}
