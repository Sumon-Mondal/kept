import { formatUSD } from "./money";
import type { Review } from "./types";

export type PurchaseUnit = {
  description: string;
  custom_id?: string;
  amount: {
    currency_code: "USD";
    value: string;
    breakdown: {
      item_total: { currency_code: "USD"; value: string };
    };
  };
  items: {
    name: string;
    quantity: string;
    unit_amount: { currency_code: "USD"; value: string };
  }[];
};

export function paypalAmount(cents: number): string {
  return formatUSD(cents).replace("$", "").replace("-", "");
}

/**
 * Item totals must equal the charge. When the buyer covers the fee, the
 * difference is its own line so the PayPal receipt shows it instead of hiding it.
 */
export function buildPurchaseUnit(review: Review, stallName: string, customId?: string): PurchaseUnit {
  const items = review.lines.map((line) => ({
    name: line.name.slice(0, 120),
    quantity: String(line.qty),
    unit_amount: { currency_code: "USD" as const, value: paypalAmount(line.unitPriceCents) },
  }));
  const listed = review.lines.reduce((sum, line) => sum + line.qty * line.unitPriceCents, 0);
  if (review.stickerCents > listed) {
    items.push({
      name: "PayPal fee cover (estimate)",
      quantity: "1",
      unit_amount: {
        currency_code: "USD",
        value: paypalAmount(review.stickerCents - listed),
      },
    });
  }
  const value = paypalAmount(review.stickerCents);
  return {
    description: `${stallName} via Kept`.slice(0, 127),
    custom_id: customId?.slice(0, 127),
    amount: {
      currency_code: "USD",
      value,
      breakdown: { item_total: { currency_code: "USD", value } },
    },
    items,
  };
}

export function purchaseUnitBalances(unit: PurchaseUnit): boolean {
  const itemTotal = unit.items.reduce((sum, item) => {
    const unitCents = Math.round(Number.parseFloat(item.unit_amount.value) * 100);
    return sum + unitCents * Number.parseInt(item.quantity, 10);
  }, 0);
  const amountCents = Math.round(Number.parseFloat(unit.amount.value) * 100);
  const breakdownCents = Math.round(Number.parseFloat(unit.amount.breakdown.item_total.value) * 100);
  return itemTotal === amountCents && amountCents === breakdownCents;
}

export type CaptureKind = "sample" | "demo" | "sandbox";

export function captureKind(captureId: string, paypalConfigured: boolean): CaptureKind {
  if (captureId.startsWith("SAMPLE-")) return "sample";
  if (captureId.startsWith("DEMO-") || !paypalConfigured) return "demo";
  return "sandbox";
}

export function readCapture(body: unknown): {
  orderId: string;
  captureId: string;
  status: string;
  value: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const record = body as {
    id?: unknown;
    status?: unknown;
    purchase_units?: {
      payments?: { captures?: { id?: unknown; status?: unknown; amount?: { value?: unknown } }[] };
    }[];
  };
  const capture = record.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture?.id || capture.amount?.value == null) return null;
  return {
    orderId: String(record.id ?? ""),
    captureId: String(capture.id),
    status: String(capture.status ?? record.status ?? ""),
    value: String(capture.amount.value),
  };
}

export function orderCreateBody(unit: PurchaseUnit) {
  return {
    intent: "CAPTURE" as const,
    purchase_units: [
      {
        description: unit.description,
        custom_id: unit.custom_id,
        amount: unit.amount,
        items: unit.items,
      },
    ],
  };
}
