import type { SaleRecord } from "./types";

export function isSameEtDay(iso: string, now: Date = new Date()): boolean {
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const left = new Date(iso);
  if (Number.isNaN(left.getTime())) return false;
  return format.format(left) === format.format(now);
}

/** Full refund clears the row. A partial refund comes out of take-home, not below zero. */
export function netKeptCents(sale: Pick<SaleRecord, "takeHomeCents" | "stickerCents" | "refund">): number {
  const refunded = sale.refund?.cents ?? 0;
  if (refunded >= sale.stickerCents && sale.stickerCents > 0) return 0;
  return Math.max(0, sale.takeHomeCents - refunded);
}

export function sumKept(
  sales: SaleRecord[],
  options?: { now?: Date; includeSamples?: boolean; todayOnly?: boolean },
): number {
  const includeSamples = options?.includeSamples !== false;
  const todayOnly = options?.todayOnly !== false;
  return sales.reduce((sum, sale) => {
    if (!includeSamples && sale.sample) return sum;
    if (todayOnly && !isSameEtDay(sale.createdAt, options?.now)) return sum;
    return sum + netKeptCents(sale);
  }, 0);
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
