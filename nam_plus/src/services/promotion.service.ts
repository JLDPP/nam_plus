/*
  ARCHIVO: promotion.service.ts

  FUNCIÓN:
  Centraliza las peticiones del frontend
  hacia la API de promociones.
*/

import { api } from "../api";

export type Promotion = {
  _id: string;
  title: string;
  description?: string;
  restaurantName: string;
  imageUrl?: string;
  minAmount: number;
  points: number;
  active: boolean;
  startDate?: string;
  endDate?: string | null;
  status?: "Programada" | "Activa" | "Vencida" | "Inactiva";
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

export async function getPromotions(): Promise<Promotion[]> {
  const response = await api.get<Promotion[]>(
    "/promotions"
  );

  return response.data;
}

export async function getPromotionById(
  id: string
): Promise<Promotion> {
  const response = await api.get<Promotion>(
    `/promotions/${id}`
  );

  return response.data;
}

export async function createPromotion(
  data: CreatePromotionData
): Promise<Promotion> {
  const response = await api.post<Promotion>(
    "/promotions",
    data
  );

  return response.data;
}

export async function updatePromotion(
  id: string,
  data: CreatePromotionData
): Promise<Promotion> {
  const response = await api.put<Promotion>(
    `/promotions/${id}`,
    data
  );

  return response.data;
}

export async function deletePromotion(
  id: string
): Promise<void> {
  await api.delete(
    `/promotions/${id}`
  );
}