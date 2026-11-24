import axios from "axios";
import { submitClaim, type ClaimedCoupon } from "./offlineQueue";
import i18n from "../i18n";

// ==========================================
// TIPOS
// ==========================================

export type RedeemResult = {
  success: boolean;
  message: string;
  code: string;
  pointsEarned?: number;
  balanceAfter?: number;
  restaurantName?: string;
  ticketId?: string;
};

// ==========================================
// NORMALIZAR CÓDIGO
// ==========================================

function normalizeCode(value: string): string {
  const input = value.trim();

  // El QR normalmente contendrá directamente
  // el código del ticket.
  //
  // También permite un enlace de Ñam+
  // con el código en ?code=.
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const codeFromUrl = url.searchParams.get("code");

      if (codeFromUrl) {
        return codeFromUrl.trim().toUpperCase();
      }
    } catch {
      return "";
    }

    return "";
  }

  return input.toUpperCase();
}

// ==========================================
// VALIDAR TICKET Y OBTENER PUNTOS
// ==========================================

export async function redeemCode(
  code: string
): Promise<RedeemResult> {
  const cleanCode = normalizeCode(code);

  if (!cleanCode) {
    return {
      success: false,
      message: "Ingresa un código válido.",
      code: "",
    };
  }

  // Debe coincidir con el formato que
  // genera el backend: NAM- + 32 caracteres.
  if (!/^NAM-[A-F0-9]{32}$/.test(cleanCode)) {
    return {
      success: false,
      message:
        "El código no tiene un formato válido. Revisa tu ticket.",
      code: cleanCode,
    };
  }

  try {
    const result = await submitClaim({ code: cleanCode });
    if (result.status === "pending") {
      return { success: false, message: i18n.t("offline.claimPending"), code: cleanCode };
    }
    const data = result.data as ClaimedCoupon;

    return {
      success: true,
      message: data.message,
      code: cleanCode,
      ticketId: data.ticketId,
      restaurantName: data.restaurantName,
      pointsEarned: data.pointsEarned,
      balanceAfter: data.balanceAfter,
    };
  } catch (error: unknown) {
    let message = i18n.t("offline.saveError");

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (typeof serverMessage === "string") {
        message = serverMessage;
      } else if (status === 401) {
        message = "Tu sesión expiró. Inicia sesión nuevamente.";
      } else if (status === 403) {
        message = "Solo los clientes pueden acumular puntos.";
      } else if (status === 404) {
        message = "No se encontró el servicio de tickets.";
      } else if (status === 409) {
        message = "El ticket ya fue utilizado o está vencido.";
      } else if (!error.response) {
        message = "No se pudo conectar con el servidor.";
      }
    }

    return {
      success: false,
      message,
      code: cleanCode,
    };
  }
}
