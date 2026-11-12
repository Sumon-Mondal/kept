import type { MenuItem } from "./menu";
import type { CartLine } from "./types";

const QTY_WORD: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  couple: 2,
};

const QTY_PATTERN =
  /(couple|ten|nine|eight|seven|six|five|four|three|two|one|an|a|\d{1,2})\s+$/;

export function normalizeNote(note: string): string {
  return ` ${note
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s.$]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function qtyBefore(prefix: string): number {
  const match = prefix.match(QTY_PATTERN);
  if (!match) return 1;
  const token = match[1];
  if (/^\d+$/.test(token)) {
    const value = Number.parseInt(token, 10);
    if (!Number.isFinite(value) || value < 1) return 1;
    return Math.min(99, value);
  }
  return QTY_WORD[token] ?? 1;
}

function dollarsToCents(raw: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const [dollars, fraction = ""] = raw.split(".");
  const whole = Number.parseInt(dollars, 10);
  const cents = Number.parseInt((fraction + "00").slice(0, 2), 10);
  const total = whole * 100 + cents;
  if (total <= 0 || total > 500_000) return null;
  return total;
}

type Hit = { index: number; length: number; item: MenuItem };

/**
 * Greedy alias match. Longer aliases win, so "extra plantain" does not
 * also become a second plantain, and "org tees" does not also become "tee".
 */
export function parseNote(note: string, menu: MenuItem[]): { menuId: string; qty: number }[] {
  const text = normalizeNote(note);
  const candidates: Hit[] = [];
  for (const item of menu) {
    for (const alias of item.aliases) {
      const needle = alias.toLowerCase();
      let from = 0;
      while (from < text.length) {
        const index = text.indexOf(needle, from);
        if (index === -1) break;
        const before = text[index - 1] ?? " ";
        const after = text[index + needle.length] ?? " ";
        if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
          candidates.push({ index, length: needle.length, item });
        }
        from = index + needle.length;
      }
    }
  }

  candidates.sort((a, b) => b.length - a.length || a.index - b.index);
  const occupied = new Array<boolean>(text.length).fill(false);
  const chosen: Hit[] = [];
  for (const candidate of candidates) {
    let overlap = false;
    for (let i = candidate.index; i < candidate.index + candidate.length; i += 1) {
      if (occupied[i]) overlap = true;
    }
    if (overlap) continue;
    for (let i = candidate.index; i < candidate.index + candidate.length; i += 1) {
      occupied[i] = true;
    }
    chosen.push(candidate);
  }

  const qtyById = new Map<string, number>();
  for (const hit of chosen.sort((a, b) => a.index - b.index)) {
    const prefix = text.slice(Math.max(0, hit.index - 24), hit.index);
    // A later "the water" points at a bottle already counted.
    if (qtyById.has(hit.item.id) && /\bthe\s+$/.test(prefix)) continue;
    const qty = qtyBefore(prefix);
    qtyById.set(hit.item.id, Math.min(99, (qtyById.get(hit.item.id) ?? 0) + qty));
  }

  return [...qtyById.entries()].map(([menuId, qty]) => ({ menuId, qty }));
}

function customLines(note: string, menu: MenuItem[]): CartLine[] {
  const text = normalizeNote(note);
  const occupiedAliases = menu.flatMap((item) => item.aliases.map((alias) => alias.toLowerCase()));
  const pattern = /([a-z][a-z ]{1,48}?) for \$?(\d{1,5}(?:\.\d{1,2})?)(?!\d)/g;
  const lines: CartLine[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const price = dollarsToCents(match[2]);
    if (!price) continue;
    const words = match[1].trim().split(/\s+/);
    const name = words.slice(-4).join(" ").trim();
    if (name.length < 3) continue;
    if (occupiedAliases.some((alias) => name.includes(alias) || alias.includes(name))) continue;
    lines.push({
      key: `custom-${lines.length}-${name.replace(/\s+/g, "-")}`,
      name: name.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      qty: 1,
      unitPriceCents: price,
    });
    if (lines.length >= 3) break;
  }
  return lines;
}

export function linesFromNote(note: string, menu: MenuItem[]): CartLine[] {
  const menuLines: CartLine[] = parseNote(note, menu).map((hit) => {
    const item = menu.find((entry) => entry.id === hit.menuId);
    if (!item) {
      throw new Error(`Missing menu item ${hit.menuId}`);
    }
    return {
      key: item.id,
      menuId: item.id,
      name: item.name,
      qty: hit.qty,
      unitPriceCents: item.priceCents,
    };
  });
  if (menuLines.length > 0) return menuLines;
  return customLines(note, menu);
}

export function clampQty(value: unknown): number {
  const qty = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(qty)) return 1;
  return Math.min(99, Math.max(1, Math.round(qty)));
}

export function linesFromClient(raw: unknown, menu: MenuItem[]): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, CartLine>();
  const customs: CartLine[] = [];

  for (const row of raw.slice(0, 30)) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const qty = clampQty(record.qty);
    if (typeof record.menuId === "string") {
      const item = menu.find((entry) => entry.id === record.menuId);
      if (!item) continue;
      const existing = merged.get(item.id);
      const nextQty = Math.min(99, (existing?.qty ?? 0) + qty);
      merged.set(item.id, {
        key: item.id,
        menuId: item.id,
        name: item.name,
        qty: nextQty,
        unitPriceCents: item.priceCents,
      });
      continue;
    }
    if (typeof record.name !== "string") continue;
    const name = record.name.trim().slice(0, 80);
    const price = Number(record.unitPriceCents);
    if (!name || !Number.isInteger(price) || price <= 0 || price > 500_000) continue;
    customs.push({
      key: `custom-${customs.length}`,
      name,
      qty,
      unitPriceCents: price,
    });
  }

  return [...merged.values(), ...customs].slice(0, 30);
}

export type ModelLineResult = {
  lines: CartLine[];
  rejected: string[];
};

/** Menu prices always win. The model may choose items and quantities, not dollars. */
export function linesFromModel(raw: unknown, menu: MenuItem[]): ModelLineResult {
  const rejected: string[] = [];
  if (!Array.isArray(raw)) return { lines: [], rejected: ["lines was not a list"] };
  const drafted: unknown[] = [];
  for (const row of raw.slice(0, 30)) {
    if (!row || typeof row !== "object") {
      rejected.push("skipped a line that was not an object");
      continue;
    }
    const record = row as Record<string, unknown>;
    if (typeof record.menuId === "string") {
      drafted.push({ menuId: record.menuId, qty: record.qty });
      if (record.unitPriceCents != null || record.priceCents != null) {
        rejected.push(`ignored a model price on ${record.menuId}`);
      }
      continue;
    }
    drafted.push({
      name: record.name,
      qty: record.qty,
      unitPriceCents: record.unitPriceCents,
    });
  }
  return { lines: linesFromClient(drafted, menu), rejected };
}
