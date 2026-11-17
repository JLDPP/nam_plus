
import { api } from "../api";

// ==========================================
// TIPOS
// ==========================================

export type PromotionStatus =
  | "Programada"
  | "Activa"
  | "Vencida"
  | "Inactiva";

export type Promotion = {
  _id: string;
  title: string;
  description?: string;
  restaurant?: string | null;
  restaurantName: string;
  imageUrl?: string;
  minAmount: number;
  points: number;
  active: boolean;
  startDate?: string;
  endDate?: string | null;
  status?: PromotionStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePromotionData = {
  title: string;
  description?: string;
  restaurantName: string;
  imageUrl?: string;
  minAmount: number;
  points: number;
  active: boolean;
  startDate?: string;
  endDate?: string | null;
};

export type RestaurantPromotionData = Omit<
  CreatePromotionData,
  "restaurantName"
>;

export type OwnedRestaurant = {
  _id: string;
  name: string;
};

export type MyPromotionsResponse = {
  restaurants: OwnedRestaurant[];
  promotions: Promotion[];
};

// ==========================================
// FUNCIONES EXISTENTES
// ==========================================

export async function getPromotions(): Promise<Promotion[]> {
  const { data } = await api.get<Promotion[]>(
    "/api/promotions"
  );

  return data;
}

export async function getPromotionById(
  id: string
): Promise<Promotion> {
  const { data } = await api.get<Promotion>(
    `/api/promotions/${id}`
  );

  return data;
}

export async function createPromotion(
  payload: CreatePromotionData
): Promise<Promotion> {
  const { data } = await api.post<Promotion>(
    "/api/promotions",
    payload
  );

  return data;
}

export async function updatePromotion(
  id: string,
  payload: CreatePromotionData
): Promise<Promotion> {
  const { data } = await api.put<Promotion>(
    `/api/promotions/${id}`,
    payload
  );

  return data;
}

export async function deletePromotion(
  id: string
): Promise<void> {
  await api.delete(
    `/api/promotions/${id}`
  );
}

// ==========================================
// CONSULTAR PROMOCIONES DEL RESTAURANTE
// ==========================================

export async function getMyPromotions(
  signal?: AbortSignal
): Promise<MyPromotionsResponse> {
  const { data } =
    await api.get<MyPromotionsResponse>(
      "/api/promotions/mine",
      { signal }
    );

  return data;
}

// ==========================================
// PUBLICAR PROMOCIÓN
// ==========================================

export async function createRestaurantPromotion(
  restaurantId: string,
  payload: RestaurantPromotionData
): Promise<Promotion> {
  const { data } = await api.post<Promotion>(
    `/api/promotions/mine/${restaurantId}`,
    payload
  );

  return data;
}

// ==========================================
// ACTUALIZAR PROMOCIÓN DEL RESTAURANTE
// ==========================================

export async function updateRestaurantPromotion(
  restaurantId: string,
  promotionId: string,
  payload: Partial<RestaurantPromotionData>
): Promise<Promotion> {
  const { data } = await api.patch<Promotion>(
    `/api/promotions/mine/${restaurantId}/${promotionId}`,
    payload
  );

  return data;
}
