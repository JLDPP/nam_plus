import { useState } from "react";
import "../styles/codigo.css";

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
      // AQUÍ conectaremos el backend después.
      // Por ahora simulamos que recibimos el código.

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      setMessage(
        `Código ${cleanCode} recibido correctamente.`
      );

      console.log(
        "Código listo para enviar al backend:",
        cleanCode
      );
    } catch (error) {
      console.error(error);

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