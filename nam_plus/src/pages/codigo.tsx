/*
  ARCHIVO: codigo.tsx

  FUNCIÓN:
  Esta pantalla permite que el usuario ingrese manualmente
  el código de un ticket para validarlo.

  MODIFICACIONES REALIZADAS:
  - Se agregó un campo para ingresar el código del ticket.
  - Se valida que el código no esté vacío.
  - Se valida que el código tenga una longitud mínima.
  - Se agregó un estado de carga mientras se procesa el código.
  - Se bloquea temporalmente el input y el botón durante la validación.
  - Se muestran mensajes de resultado al usuario.
  - Se conectó esta pantalla con redeemCode().
  - El código manual y el QR utilizan la misma lógica.
  - Más adelante redeemCode() enviará el código al backend.
*/

import { useState } from "react";
import "../styles/codigo.css";
import { redeemCode } from "../services/redeem.service";

export default function Codigo() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanCode = code.trim();

    if (!cleanCode) {
      setMessage("Ingresa un código válido.");
      return;
    }

    if (cleanCode.length < 4) {
      setMessage("El código es demasiado corto.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await redeemCode(cleanCode);

      setMessage(result.message);

      console.log(
        "Resultado del código:",
        result
      );
    } catch (error) {
      console.error(
        "Error procesando el código:",
        error
      );

      setMessage(
        "No se pudo procesar el código."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="code-page">
      <div className="code-container">
        <div className="code-header">
          <div>
            <h1>Ingresar código</h1>

            <p>
              Escribe el código de tu ticket para
              obtener tus puntos.
            </p>
          </div>

          <button
            type="button"
            className="code-back-btn"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            Volver
          </button>
        </div>

        <form
          className="code-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="ticket-code">
            Código del ticket
          </label>

          <input
            id="ticket-code"
            type="text"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            placeholder="Ej. NAM-4F7K92"
            autoComplete="off"
            disabled={loading}
          />

          <button
            type="submit"
            className="code-submit-btn"
            disabled={loading}
          >
            {loading
              ? "Validando..."
              : "Validar código"}
          </button>

          {message && (
            <p className="code-message">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}