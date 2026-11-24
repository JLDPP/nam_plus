
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

export function rewardImageUrl(imageUrl: string): string {
  if (!/^\/api\/(rewards|promotions)\/images\//.test(imageUrl)) return imageUrl;

  const base = new URL(api.defaults.baseURL || "/", window.location.origin);
  return new URL(imageUrl, base).href;
}

// Obtener las recompensas disponibles
export async function getRewards(signal?: AbortSignal): Promise<Reward[]> {
  const response = await api.get<Reward[]>(
    "/api/rewards", { signal }
  );

  return response.data;
}
