
import { api } from "../api";

// Datos de la recompensa
export interface RedemptionReward {
  _id: string;
  name: string;
  restaurantName: string;
  imageUrl?: string;
}

// Datos de un canje
export interface Redemption {
  _id: string;
  user: string;
  reward: RedemptionReward | null;
  pointsSpent: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

// Respuesta del backend al realizar un canje
export interface RedemptionResponse {
  message: string;
  redemption: Redemption;
}

// Realizar un canje
export async function redeemReward(
  rewardId: string
): Promise<RedemptionResponse> {
  const response = await api.post<RedemptionResponse>(
    "/api/redemptions",
    {
      rewardId,
    }
  );

  return response.data;
}

// Consultar historial de canjes
export async function getMyRedemptions(): Promise<Redemption[]> {
  const response = await api.get<Redemption[]>(
    "/api/redemptions/history"
  );

  return response.data;
}

// Alias para conservar compatibilidad con otros archivos
export async function getRedemptions(): Promise<Redemption[]> {
  return getMyRedemptions();
}
