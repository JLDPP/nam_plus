import type { Account } from "./account.service";

const dbName = "nam-plus-offline";
const storeName = "records";
let database: Promise<IDBDatabase> | undefined;

export type StoredSession = { signature: string; account: Account; savedAt: number; expiresAt: number };
export type Purchase = { amountMXN: number; customerEmail: string; points?: number };
export type Claim = { code: string };
type OperationState =
  | { status: "pending" }
  | { status: "synced"; result?: { code: string; emailSent: boolean; emailPending?: boolean; emailError?: string } }
  | { status: "rejected"; message: string };
export type Operation = {
  id: string;
  accountId: string;
  createdAt: number;
} & ({ kind: "purchase"; body: Purchase } | { kind: "claim"; body: Claim }) & OperationState;

function openDatabase() {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(storeName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("El almacenamiento local está bloqueado."));
    }).catch((error) => {
      database = undefined;
      throw error;
    });
  }
  return database;
}

async function read<T>(key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function write(key: string, value: unknown) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

function expiry(token: string): number {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const expiresAt = Number(JSON.parse(atob(payload)).exp) * 1000;
    return Number.isFinite(expiresAt) ? expiresAt : 0;
  } catch {
    return 0;
  }
}

async function signature(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function saveSession(token: string, account: Account) {
  const snapshot = { signature: await signature(token), account, savedAt: Date.now(), expiresAt: expiry(token) };
  await write("session", snapshot);
  return snapshot;
}

export async function restoreSession(token: string) {
  const previous = await read<StoredSession>("session");
  return previous && previous.expiresAt > Date.now() && previous.signature === await signature(token)
    ? previous : undefined;
}

const snapshotKey = (account: Account, url: string) => `snapshot:${account.id}:${account.role}:${url}`;
export const saveSnapshot = (account: Account, url: string, data: unknown) =>
  write(snapshotKey(account, url), { data, savedAt: Date.now() });
export const readSnapshot = (account: Account, url: string) =>
  read<{ data: unknown; savedAt: number }>(snapshotKey(account, url));

const operationPrefix = (accountId: string) => `operation:${accountId}:`;
export function saveOperation(operation: Operation) {
  return write(operationPrefix(operation.accountId) + operation.id, operation);
}

export async function listOperations(accountId: string): Promise<Operation[]> {
  const db = await openDatabase();
  const prefix = operationPrefix(accountId);
  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.bound(prefix, prefix + "\uffff");
    const request = db.transaction(storeName).objectStore(storeName).getAll(range);
    request.onsuccess = () => resolve(request.result.sort((a: Operation, b: Operation) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error);
  });
}

export async function removeOperation(accountId: string, id: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(operationPrefix(accountId) + id);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
}
