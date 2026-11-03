/*
  ARCHIVO: redeem.service.ts

  FUNCIÓN:
  Centraliza la lógica de validación y procesamiento
  de los códigos de los tickets.

  MODIFICACIONES REALIZADAS:
  - Se creó una función reutilizable llamada redeemCode().
  - Se eliminan espacios innecesarios del código.
  - Se valida que exista un código.
  - Se valida una longitud mínima.
  - Se devuelve un resultado estándar con success, message y code.
  - Actualmente utiliza una simulación de 500 ms.
  - Tanto qr.tsx como codigo.tsx utilizan esta misma función.
  - Más adelante aquí se conectará el endpoint real del backend.
  - Esto evita duplicar lógica en diferentes pantallas.
*/

export type RedeemResult = {
  success: boolean;
  message: string;
  code: string;
};

export async function redeemCode(
  code: string
): Promise<RedeemResult> {
  const cleanCode = code.trim();

  if (!cleanCode) {
    return {
      success: false,
      message: "Ingresa un código válido.",
      code: "",
    };
  }

  if (cleanCode.length < 4) {
    return {
      success: false,
      message: "El código es demasiado corto.",
      code: cleanCode,
    };
  }

  // Simulación temporal.
  // Después aquí conectaremos el backend real.
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  return {
    success: true,
    message: "Código recibido correctamente.",
    code: cleanCode,
  };
}