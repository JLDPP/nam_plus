import { isAxiosError } from "axios";
import { api, setAuth } from "../api";

export type Role = "cliente" | "restaurante" | "admin";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
  pointsBalance: number;
}

export function cacheAccount(account: Account, token?: string) {
  localStorage.setItem("user", JSON.stringify(account));
  if (token) {
    localStorage.setItem("token", token);
    setAuth(token);
  }
}

export function getAccountError(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || fallback
    : fallback;
}

export async function getOwnAccount(signal?: AbortSignal) {
  return (await api.get<Account>("/api/auth/me", { signal })).data;
}
