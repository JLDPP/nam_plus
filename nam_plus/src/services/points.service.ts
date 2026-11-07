
import { api } from "../api";

// Información del saldo de puntos
export interface PointsBalance {
  pointsBalance: number;
}

// Información de los movimientos de puntos
export interface PointsTransaction {
  _id: string;
  type: "earn" | "redeem" | "adjustment";
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

// Consultar el saldo de puntos del usuario
export async function getPointsBalance(): Promise<number> {
  const response = await api.get<PointsBalance>(
    "/api/points/balance"
  );

  return response.data.pointsBalance ?? 0;
}

// Consultar el historial de movimientos de puntos
export async function getPointsHistory(): Promise<PointsTransaction[]> {
  const response = await api.get<PointsTransaction[]>(
    "/api/points/history"
  );

  return response.data;
}
