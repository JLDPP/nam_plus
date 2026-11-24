import { isAxiosError } from "axios";
import { api } from "../api";
import { getOwnAccount, type Account } from "./account.service";
import { listOperations, restoreSession, saveOperation, type Claim, type Operation, type Purchase } from "./offlineStore";

export const queueChanged = "nam-plus:offline-queue";
const notify = () => window.dispatchEvent(new Event(queueChanged));

export type IssuedCoupon = {
  ticket: { id: string; code: string; restaurantName: string; amountMXN: number; points: number; status: string; expiresAt: string };
  email: { sent: boolean; pending?: boolean; error?: string; recipient: string };
};

export type ClaimedCoupon = {
  message: string; ticketId: string; restaurantName: string; pointsEarned: number; balanceAfter: number;
};

type Result = { status: "pending" } | { status: "synced"; data: IssuedCoupon | ClaimedCoupon };
const inFlight = new Map<string, Promise<Result>>();

function syncOperation(operation: Operation, token: string): Promise<Result> {
  const active = inFlight.get(operation.id);
  if (active) return active;
  const task = executeOperation(operation, token).finally(() => inFlight.delete(operation.id));
  inFlight.set(operation.id, task);
  return task;
}

async function executeOperation(operation: Operation, token: string): Promise<Result> {
  if (!navigator.onLine || localStorage.getItem("token") !== token) return { status: "pending" };

  const endpoint = operation.kind === "purchase" ? "/api/tickets" : "/api/tickets/claim";
  const body = { ...operation.body, operationId: operation.id };
  const config = { timeout: 12_000, headers: { Authorization: `Bearer ${token}` } };
  let data: IssuedCoupon | ClaimedCoupon;
  try {
    data = (await api.post<IssuedCoupon | ClaimedCoupon>(endpoint, body, config)).data;
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status && status >= 400 && status < 500 && ![401, 408, 429].includes(status)) {
      const message = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      await saveOperation(operation.status === "synced" && operation.result
        ? { ...operation, result: { ...operation.result, emailPending: false } }
        : { ...operation, status: "rejected", message: message || "El servidor rechazó la operación." });
      notify();
      throw error;
    }
    return { status: "pending" };
  }

  await saveOperation({ ...operation, status: "synced",
    ...("ticket" in data ? { result: {
      code: data.ticket.code, emailSent: data.email.sent,
      emailPending: data.email.pending, emailError: data.email.error,
    } } : {}),
  });
  notify();
  if (operation.kind === "claim") window.dispatchEvent(new Event("nam-plus:points-updated"));
  return { status: "synced", data };
}

async function submit(input: { kind: "purchase"; body: Purchase } | { kind: "claim"; body: Claim }) {
  const token = localStorage.getItem("token");
  const session = token && await restoreSession(token).catch(() => undefined);
  if (!token || !session) {
    if (!navigator.onLine) throw new Error("Inicia sesión con conexión antes de guardar operaciones sin internet.");
    // Si IndexedDB está bloqueado, el flujo en línea sigue disponible.
    const endpoint = input.kind === "purchase" ? "/api/tickets" : "/api/tickets/claim";
    const { data } = await api.post<IssuedCoupon | ClaimedCoupon>(endpoint, input.body);
    return { status: "synced", data } as const;
  }

  if (input.kind === "claim") {
    const existing = (await listOperations(session.account.id)).find((item) =>
      item.status === "pending" && item.kind === "claim" && item.body.code === input.body.code
    );
    if (existing) return syncOperation(existing, token);
  }

  const operation: Operation = {
    ...input, id: crypto.randomUUID(), accountId: session.account.id, createdAt: Date.now(), status: "pending",
  };
  await saveOperation(operation);
  notify();
  return syncOperation(operation, token);
}

export const submitPurchase = (body: Purchase) => submit({ kind: "purchase", body });
export const submitClaim = (body: Claim) => submit({ kind: "claim", body });

let syncing: Promise<void> | undefined;
export function syncQueue(account: Account) {
  if (!navigator.onLine || account.role === "admin") return Promise.resolve();
  if (syncing) return syncing;
  syncing = (async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const operations = (await listOperations(account.id)).filter((item) =>
      item.status === "pending" || (item.status === "synced" && item.result?.emailPending)
    );
    if (!operations.length) return;
    const current = await getOwnAccount();
    if (current.id !== account.id || current.role !== account.role) return;
    for (const operation of operations) {
      if (operation.kind !== (current.role === "cliente" ? "claim" : "purchase")) continue;
      await syncOperation(operation, token).catch(() => {});
    }
  })().finally(() => { syncing = undefined; });
  return syncing;
}
