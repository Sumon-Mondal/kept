/**
 * PayPal fee estimates in integer cents.
 *
 * Checkout rate: US commercial PayPal Checkout, 3.49% + $0.49.
 * Micropayments: 4.99% + $0.09, only if PayPal has approved that pricing.
 * Source: https://www.paypal.com/us/business/paypal-business-fees
 * (fee page last updated November 4, 2026). Real fees vary by account,
 * product, and country. The language model is never asked to do this math.
 */

export const CHECKOUT_FEE = {
  name: "PayPal Checkout",
  bps: 349,
  fixedCents: 49,
  asOf: "2026-11-04",
  url: "https://www.paypal.com/us/business/paypal-business-fees",
} as const;

export const MICRO_FEE = {
  name: "PayPal micropayments",
  bps: 499,
  fixedCents: 9,
  note: "Applies only when PayPal has approved micropayments pricing on the account.",
} as const;

export type FeeSchedule = {
  bps: number;
  fixedCents: number;
};

/** Half-up percentage fee, computed in integers so 0.5¢ rounds away from zero. */
export function variableFeeCents(amountCents: number, bps: number): number {
  if (amountCents <= 0 || bps <= 0) return 0;
  return Math.floor((amountCents * bps + 5000) / 10000);
}

export function feeCentsFor(amountCents: number, schedule: FeeSchedule): number {
  if (amountCents <= 0) return 0;
  return variableFeeCents(amountCents, schedule.bps) + schedule.fixedCents;
}

export function checkoutFeeCents(amountCents: number): number {
  return feeCentsFor(amountCents, CHECKOUT_FEE);
}

export function microFeeCents(amountCents: number): number {
  return feeCentsFor(amountCents, MICRO_FEE);
}

export function takeHomeCents(amountCents: number, schedule: FeeSchedule = CHECKOUT_FEE): number {
  return amountCents - feeCentsFor(amountCents, schedule);
}

/**
 * Smallest charge (cents) whose Checkout take-home is at least `targetCents`.
 * Walks a cent at a time so rounding cannot leave the seller short.
 */
export function stickerForTakeHome(targetCents: number): number {
  if (targetCents <= 0) return 0;
  const rate = 1 - CHECKOUT_FEE.bps / 10000;
  let guess = Math.ceil((targetCents + CHECKOUT_FEE.fixedCents) / rate);
  let guard = 0;
  while (takeHomeCents(guess) < targetCents && guard < 5000) {
    guess += 1;
    guard += 1;
  }
  guard = 0;
  while (guess > 1 && takeHomeCents(guess - 1) >= targetCents && guard < 5000) {
    guess -= 1;
    guard += 1;
  }
  return guess;
}

export function formatUSD(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars}.${rem.toString().padStart(2, "0")}`;
}

export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "0%";
  return `${Math.round(ratio * 100)}%`;
}

export function centsToInput(cents: number): string {
  return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
}

/** Accepts "12", "12.5", "12.50", "$12.50". Returns cents or null. */
export function parseDollarInput(input: string): number | null {
  const trimmed = input.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return null;
  const [dollars, fraction = ""] = trimmed.split(".");
  const cents = Number.parseInt((fraction + "00").slice(0, 2), 10);
  const whole = Number.parseInt(dollars, 10);
  if (!Number.isFinite(whole) || !Number.isFinite(cents)) return null;
  return whole * 100 + cents;
}
