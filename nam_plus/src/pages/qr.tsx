/*
  ARCHIVO: qr.tsx

  FUNCIÓN:
  Esta pantalla permite escanear un código QR usando la cámara
  del dispositivo.

  MODIFICACIONES REALIZADAS:
  - Se agregó la librería html5-qrcode para acceder a la cámara.
  - Se agregó lectura automática del contenido del QR.
  - Se guarda el código detectado en scannedCode.
  - Se agregó un mensaje cuando el QR es detectado correctamente.
  - Se agregó la opción de detener la cámara después de leer un QR.
  - Se agregó el botón "Continuar" para procesar el código detectado.
  - Se agregó el botón "Escanear otro" para reiniciar el lector.
  - Se conectó esta pantalla con redeemCode().
  - QR e ingreso manual ahora utilizan la misma función de validación.
  - Más adelante redeemCode() se conectará al backend real.
*/

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { redeemCode } from "../services/redeem.service";
import "../styles/qr.css";

export default function Qr() {
  const [message, setMessage] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    async function startScanner() {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText) => {
            setScannedCode(decodedText);
            setMessage("Código QR detectado correctamente.");

            console.log(
              "Código QR detectado:",
              decodedText
            );

            try {
              await scanner.stop();
            } catch {
              // Puede que el lector ya se haya detenido
            }
          },
          () => {
            // Ignoramos errores mientras busca un QR
          }
        );
      } catch (error) {
        console.error(
          "Error al iniciar la cámara:",
          error
        );

        setMessage(
          "No se pudo acceder a la cámara. Revisa los permisos del navegador."
        );
      }
    }

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }
    };
  }, []);

  async function processCode() {
    if (!scannedCode) {
      setMessage(
        "Primero escanea un código QR."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await redeemCode(
        scannedCode
      );

      setMessage(result.message);

      console.log(
        "Resultado del QR:",
        result
      );
    } catch (error) {
      console.error(
        "Error procesando el QR:",
        error
      );

      setMessage(
        "No se pudo procesar el código QR."
      );
    } finally {
      setLoading(false);
    }
  }

  function scanAgain() {
    window.location.reload();
  }

  function goBack() {
    window.location.href = "/dashboard";
  }

  return (
    <div className="qr-page">
      <div className="qr-container">
        <div className="qr-header">
          <div>
            <h1>Escanear QR</h1>

            <p>
              Escanea el código QR de tu ticket
              para obtener tus puntos.
            </p>
          </div>

          <button
            type="button"
            className="qr-back-btn"
            onClick={goBack}
          >
            Volver
          </button>
        </div>

        <div className="qr-reader-wrapper">
          <div id="qr-reader"></div>
        </div>

        {scannedCode && (
          <div className="qr-result">
            <p>
              Código detectado
            </p>

            <strong>
              {scannedCode}
            </strong>
          </div>
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
                  ? "Validando..."
                  : "Continuar"}
              </button>

              <button
                type="button"
                className="qr-secondary-btn"
                onClick={scanAgain}
                disabled={loading}
              >
                Escanear otro
              </button>
            </>
          )}
        </div>

        {message && (
          <p className="qr-message">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}