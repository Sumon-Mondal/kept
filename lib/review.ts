import { checkoutFeeCents, formatUSD, microFeeCents, stickerForTakeHome } from "./money";
import { assessRisk, mentionsSeparateCheckout } from "./risk";
import type { BundleAdvice, CartLine, ClerkSource, Review } from "./types";

const ONES = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

export function firstName(name: string): string {
  const piece = name.trim().split(/\s+/)[0];
  return piece || "You";
}

function pluralize(name: string, qty: number): string {
  if (qty === 1) return name;
  if (/s$/i.test(name)) return name;
  if (/\)$/.test(name)) return name.replace(/\)\s*$/, "s)");
  return `${name}s`;
}

function qtyWord(qty: number): string {
  if (qty >= 1 && qty <= 10) return ONES[qty - 1];
  return String(qty);
}

export function itemPhrase(lines: CartLine[]): string {
  const parts = lines.map((line) => `${qtyWord(line.qty)} ${pluralize(line.name, line.qty)}`.toLowerCase());
  if (parts.length === 0) return "nothing";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function menuCentsOf(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty * line.unitPriceCents, 0);
}

function bundleAdvice(note: string, lines: CartLine[], menuCents: number): BundleAdvice | null {
  if (lines.length === 0 || menuCents <= 0) return null;
  const aloneFees = lines.map((line) => checkoutFeeCents(line.qty * line.unitPriceCents));
  const separate = aloneFees.reduce((sum, fee) => sum + fee, 0);
  const together = checkoutFeeCents(menuCents);
  const waste = separate - together;
  const uglyAlone = lines.some((line) => {
    const amount = line.qty * line.unitPriceCents;
    return amount > 0 && checkoutFeeCents(amount) / amount >= 0.15;
  });

  if (lines.length === 1 && uglyAlone) {
    const fee = checkoutFeeCents(menuCents);
    return {
      code: "small_ticket",
      title: "The fixed fee eats this one",
      detail: `A ${formatUSD(menuCents)} PayPal Checkout estimates ${formatUSD(fee)} in fees, ${Math.round((fee / menuCents) * 100)}% of the price. $0.49 of that is fixed, so it barely shrinks on a bottle of water. If they are buying anything else, ring it on this same order.`,
    };
  }

  if ((mentionsSeparateCheckout(note) || uglyAlone) && lines.length > 1 && waste > 0) {
    return {
      code: "keep_together",
      title: "Ring it as one checkout",
      detail: `Separate PayPal checkouts each add another $0.49 fixed fee. Together, the estimated fee on the menu total is ${formatUSD(together)}. Split by line, it would be about ${formatUSD(separate)} — ${formatUSD(waste)} more.`,
      wasteCents: waste,
    };
  }

  return null;
}

function buyerLine(coverFee: boolean, stickerCents: number, menuCents: number, homeCents: number): string {
  if (menuCents <= 0) return "Add an item and I will price what you keep.";
  if (coverFee) {
    return `It's ${formatUSD(stickerCents)}. That covers the PayPal fee, so I still keep the ${formatUSD(menuCents)} menu price.`;
  }
  return `It's ${formatUSD(menuCents)}. I keep about ${formatUSD(homeCents)} after PayPal's fee.`;
}

function receiptProse(input: {
  sellerName: string;
  stallName: string;
  lines: CartLine[];
  stickerCents: number;
  feeCents: number;
  takeHomeCents: number;
  highRisk: boolean;
}): string {
  const who = firstName(input.sellerName);
  const caution = input.highRisk
    ? "Do not treat a screenshot or another app as this payment. This capture is the receipt."
    : "This capture is the receipt.";
  return `${who}, you sold ${itemPhrase(input.lines)} at ${input.stallName}. The buyer paid ${formatUSD(input.stickerCents)} on PayPal. The Checkout fee estimate is ${formatUSD(input.feeCents)}. You keep ${formatUSD(input.takeHomeCents)}. ${caution}`;
}

function sellerNote(riskDetail: string[], bundle: BundleAdvice | null, microLine: string | null): string {
  const parts = [...riskDetail];
  if (bundle) parts.push(bundle.detail);
  if (microLine) parts.push(microLine);
  return parts.join(" ");
}

export function buildReview(input: {
  note: string;
  lines: CartLine[];
  coverFee: boolean;
  stallName: string;
  sellerName: string;
  source?: ClerkSource;
}): Review {
  const lines = input.lines;
  const menuCents = menuCentsOf(lines);
  const feeIfMenuCents = checkoutFeeCents(menuCents);
  const takeHomeIfMenuCents = menuCents - feeIfMenuCents;
  const stickerCents = menuCents <= 0 ? 0 : input.coverFee ? stickerForTakeHome(menuCents) : menuCents;
  const feeCents = checkoutFeeCents(stickerCents);
  const home = stickerCents - feeCents;
  const micro = microFeeCents(menuCents);
  const microCheaper = menuCents > 0 && micro < feeIfMenuCents;
  const risk = assessRisk(input.note, lines);
  const bundle = bundleAdvice(input.note, lines, menuCents);
  const microLine =
    microCheaper && menuCents < 2700
      ? `If PayPal has approved micropayments on this account (4.99% + $0.09), the estimate on the menu total would be ${formatUSD(micro)} instead of ${formatUSD(feeIfMenuCents)}. This button still uses the PayPal Checkout rate, 3.49% + $0.49.`
      : null;

  const review: Review = {
    lines,
    note: input.note,
    menuCents,
    stickerCents,
    feeCents,
    takeHomeCents: home,
    coverFee: input.coverFee,
    feeIfMenuCents,
    takeHomeIfMenuCents,
    microFeeCents: micro,
    microCheaper,
    risk,
    bundle,
    buyerLine: buyerLine(input.coverFee, stickerCents, menuCents, takeHomeIfMenuCents),
    sellerNote: "",
    receipt: receiptProse({
      sellerName: input.sellerName,
      stallName: input.stallName,
      lines,
      stickerCents,
      feeCents,
      takeHomeCents: home,
      highRisk: risk.level === "high",
    }),
    source: input.source ?? "on-device",
  };

  review.sellerNote = sellerNote(
    risk.flags.map((flag) => flag.detail),
    bundle,
    microLine,
  );
  return review;
}

export function includesMoney(prose: string, amounts: number[]): boolean {
  return amounts.every((cents) => prose.includes(formatUSD(cents)));
}

/** Keep the model's sentences only when they repeat the cents we already computed. */
export function applyModelProse(
  review: Review,
  draft: { buyerLine?: string; receipt?: string },
): Review {
  const next: Review = { ...review, source: "model" };
  const buyer = draft.buyerLine?.trim();
  const receipt = draft.receipt?.trim();
  if (buyer && includesMoney(buyer, [review.stickerCents, review.coverFee ? review.menuCents : review.takeHomeCents])) {
    next.buyerLine = buyer;
  }
  if (receipt && includesMoney(receipt, [review.stickerCents, review.feeCents, review.takeHomeCents])) {
    next.receipt = receipt;
  }
  return next;
}

export function canCharge(review: Review, acknowledged: boolean): { ok: true } | { ok: false; reason: string } {
  if (review.lines.length === 0 || review.menuCents <= 0) {
    return { ok: false, reason: "Add at least one priced item." };
  }
  if (review.lines.some((line) => line.qty < 1 || line.unitPriceCents <= 0)) {
    return { ok: false, reason: "Every item needs a quantity and a price." };
  }
  if (review.takeHomeCents <= 0) {
    return {
      ok: false,
      reason: "The estimated PayPal fee is larger than this sale. Bundle it onto a bigger order.",
    };
  }
  if (review.risk.level === "high" && !acknowledged) {
    return { ok: false, reason: "Acknowledge the hold before charging. A screenshot is not a payment." };
  }
  return { ok: true };
}
