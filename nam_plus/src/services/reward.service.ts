
import { api } from "../api";

export interface Reward {
  _id: string;
  name: string;
  description?: string;
  restaurantName: string;
  imageUrl?: string;
  pointsCost: number;
  stock: number;
  active: boolean;
}

// Obtener las recompensas disponibles
export async function getRewards(): Promise<Reward[]> {
  const response = await api.get<Reward[]>(
    "/api/rewards"
  );

  return response.data;
}
