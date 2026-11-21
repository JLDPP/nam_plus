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

export interface Customer {
  _id: string;
  name: string;
  email: string;
}

export interface TransferPointsResponse {
  message: string;
  customer: Customer & {
    pointsBalance: number;
  };
  pointsTransferred: number;
  transactionId: string;
}

// CONSULTAR SALDO
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

// BUSCAR CLIENTE
export async function findCustomer(
  email: string
): Promise<Customer> {
  const response = await api.get<{
    customer: Customer;
  }>("/api/points/customer", {
    params: { email },
  });

  return response.data.customer;
}

// TRANSFERIR PUNTOS
export async function transferPoints(
  customerId: string,
  points: number
): Promise<TransferPointsResponse> {
  const response = await api.post<TransferPointsResponse>(
    "/api/points/transfer",
    {
      customerId,
      points,
    }
  );

  return response.data;
}