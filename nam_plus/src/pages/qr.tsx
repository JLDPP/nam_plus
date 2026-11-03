import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "../styles/qr.css";

export default function Qr() {
  const [message, setMessage] = useState("");
  const [scannedCode, setScannedCode] = useState("");
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

            console.log("Código QR detectado:", decodedText);

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
        console.error(error);

        setMessage(
          "No se pudo acceder a la cámara. Revisa los permisos del navegador."
        );
      }
    }

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  function processCode() {
    if (!scannedCode) {
      setMessage("Primero escanea un código QR.");
      return;
    }

    console.log(
      "Código listo para enviar al backend:",
      scannedCode
    );

    setMessage(
      `Código ${scannedCode} listo para procesarse.`
    );
  }

  function scanAgain() {
    window.location.reload();
  }

  return (
    <div className="qr-page">
      <div className="qr-container">
        <div className="qr-header">
          <div>
            <h1>Escanear QR</h1>

            <p>
              Escanea el código QR de tu ticket para obtener tus puntos.
            </p>
          </div>

          <button
            className="qr-back-btn"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            Volver
          </button>
        </div>

        <div className="qr-reader-wrapper">
          <div id="qr-reader"></div>
        </div>

        {scannedCode && (
          <div className="qr-result">
            <p>Código detectado</p>
            <strong>{scannedCode}</strong>
          </div>
        )}

        <div className="qr-actions">
          {scannedCode && (
            <>
              <button
                className="qr-primary-btn"
                onClick={processCode}
              >
                Continuar
              </button>

              <button
                className="qr-secondary-btn"
                onClick={scanAgain}
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