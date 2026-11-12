import { menuFromPrices, type MenuItem } from "./menu";
import { linesFromClient, linesFromNote } from "./parse";
import type { CartLine } from "./types";

export type CartRequest = {
  note: string;
  lines: CartLine[];
  coverFee: boolean;
  stallName: string;
  sellerName: string;
  campus: string;
  acknowledged: boolean;
  menu: MenuItem[];
  rebuildFromNote: boolean;
};

function clip(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, max);
  return trimmed || fallback;
}

export function readCartRequest(body: unknown): CartRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Missing sale." };
  const record = body as Record<string, unknown>;
  const prices: Record<string, number> = {};
  if (Array.isArray(record.menuPrices)) {
    for (const row of record.menuPrices) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      if (typeof item.id !== "string" || !Number.isInteger(item.priceCents)) continue;
      prices[item.id] = item.priceCents as number;
    }
  }
  const menu = menuFromPrices(prices);
  const note = typeof record.note === "string" ? record.note.slice(0, 2000) : "";
  const rebuildFromNote = record.rebuildFromNote === true;
  const lines = rebuildFromNote ? linesFromNote(note, menu) : linesFromClient(record.lines, menu);
  return {
    note,
    lines,
    coverFee: record.coverFee !== false,
    stallName: clip(record.stallName, "Stall", 80),
    sellerName: clip(record.sellerName, "Seller", 80),
    campus: clip(record.campus, "Livingstone College", 80),
    acknowledged: record.acknowledged === true,
    menu,
    rebuildFromNote,
  };
}

export function isCartError(value: CartRequest | { error: string }): value is { error: string } {
  return "error" in value && !("lines" in value);
}
