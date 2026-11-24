import { api } from "../api";

export interface PointsBalance {
  pointsBalance: number;
}

export interface PointsTransaction {
  _id: string;
  type: "earn" | "redeem" | "adjustment";
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export async function getPointsBalance(): Promise<number> {
  const response = await api.get<PointsBalance>(
    "/api/points/balance"
  );

  return response.data.pointsBalance ?? 0;
}

// CONSULTAR HISTORIAL
export async function getPointsHistory(): Promise<
  PointsTransaction[]
> {
  const response = await api.get<PointsTransaction[]>(
    "/api/points/history"
  );

  return response.data;
}
