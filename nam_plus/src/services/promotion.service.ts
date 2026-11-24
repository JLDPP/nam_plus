import { api } from "../api";

export type PromotionStatus =
  | "Programada"
  | "Activa"
  | "Vencida"
  | "Inactiva";

export type CreatePromotionData = {
  title: string;
  description?: string;
  restaurantName: string;
  imageUrl?: string;
  minAmount: number;
  points: number;
  pointsCost?: number;
  active: boolean;
  startDate?: string;
  endDate?: string | null;
};

export type Promotion = CreatePromotionData & {
  _id: string;
  stock?: number;
  restaurant?: string | null;
  status?: PromotionStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type RestaurantPromotionData = Omit<
  CreatePromotionData,
  "restaurantName"
> & {
  restaurantName?: string;
};

export type OwnedRestaurant = {
  _id: string;
  name: string;
};

export type MyPromotionsResponse = {
  restaurants: OwnedRestaurant[];
  promotions: Promotion[];
};

function withImage(promotion: Promotion): Promotion {
  if (!promotion.imageUrl?.startsWith("/api/promotions/images/")) {
    return promotion;
  }

  const apiBase = new URL(
    api.defaults.baseURL || "/",
    window.location.origin
  );

  return {
    ...promotion,
    imageUrl: new URL(promotion.imageUrl, apiBase).href,
  };
}

export function isPromotionAvailable(promotion: Promotion, now: Date): boolean {
  return promotion.active &&
    (!promotion.startDate || new Date(promotion.startDate) <= now) &&
    (!promotion.endDate || new Date(promotion.endDate) >= now);
}

export async function getPromotions(signal?: AbortSignal): Promise<Promotion[]> {
  const { data } = await api.get<Promotion[]>("/api/promotions", { signal });
  return data.map(withImage);
}

export async function getPromotionById(id: string): Promise<Promotion> {
  const { data } = await api.get<Promotion>(`/api/promotions/${id}`);
  return withImage(data);
}

export async function createPromotion(
  payload: CreatePromotionData
): Promise<Promotion> {
  const { data } = await api.post<Promotion>("/api/promotions", payload);
  return withImage(data);
}

export async function updatePromotion(
  id: string,
  payload: CreatePromotionData
): Promise<Promotion> {
  const { data } = await api.put<Promotion>(`/api/promotions/${id}`, payload);
  return withImage(data);
}

export async function deletePromotion(id: string): Promise<void> {
  await api.delete(`/api/promotions/${id}`);
}

export async function getMyPromotions(
  signal?: AbortSignal
): Promise<MyPromotionsResponse> {
  const { data } = await api.get<MyPromotionsResponse>(
    "/api/promotions/mine",
    { signal }
  );

  return {
    ...data,
    promotions: data.promotions.map(withImage),
  };
}

function buildPromotionRequest(
  payload: Partial<RestaurantPromotionData>,
  image?: File | null
) {
  if (!image) {
    return { body: payload, config: undefined };
  }

  const body = new FormData();
  body.append("promotion", JSON.stringify(payload));
  body.append("image", image);

  return {
    body,
    config: {
      headers: { "Content-Type": "multipart/form-data" },
    },
  };
}

export async function createRestaurantPromotion(
  restaurantId: string,
  payload: RestaurantPromotionData,
  image?: File | null
): Promise<Promotion> {
  const { body, config } = buildPromotionRequest(payload, image);

  const { data } = await api.post<Promotion>(
    `/api/promotions/mine/${restaurantId}`,
    body,
    config
  );

  return withImage(data);
}

export async function updateRestaurantPromotion(
  restaurantId: string,
  promotionId: string,
  payload: Partial<RestaurantPromotionData>,
  image?: File | null
): Promise<Promotion> {
  const { body, config } = buildPromotionRequest(payload, image);

  const { data } = await api.patch<Promotion>(
    `/api/promotions/mine/${restaurantId}/${promotionId}`,
    body,
    config
  );

  return withImage(data);
}