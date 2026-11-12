import type { Stall } from "./menu";
import type { CartLine, SaleRecord } from "./types";

const STATE_KEY = "kept.v1";
const PENDING_KEY = "kept.pending.v1";

export type Persisted = {
  version: 1;
  stall: Stall;
  prices: Record<string, number>;
  sales: SaleRecord[];
};

export type PendingSale = {
  note: string;
  lines: CartLine[];
  coverFee: boolean;
  acknowledged: boolean;
};

function memory(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadPersisted(): Persisted | null {
  const store = memory();
  if (!store) return null;
  try {
    const raw = store.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed || parsed.version !== 1 || !parsed.stall || !Array.isArray(parsed.sales)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersisted(state: Persisted): void {
  memory()?.setItem(STATE_KEY, JSON.stringify(state));
}

export function savePending(pending: PendingSale): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function loadPending(): PendingSale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSale;
    if (!parsed || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_KEY);
}
