import { describe, expect, it } from "vitest";
import { DEFAULT_MENU, DEFAULT_STALL } from "./menu";
import { linesFromNote } from "./parse";
import { PRESETS } from "./presets";
import { applyModelProse, buildReview, canCharge, includesMoney } from "./review";
import { buildPurchaseUnit, captureKind, purchaseUnitBalances, readCapture } from "./paypal-order";
import { isSameEtDay, netKeptCents, sumKept } from "./ledger";
import { buildSampleEvening } from "./samples";
import { formatUSD } from "./money";

function reviewFor(presetId: string, coverFee = true) {
  const note = PRESETS.find((preset) => preset.id === presetId)!.note;
  const lines = linesFromNote(note, DEFAULT_MENU);
  return buildReview({
    note,
    lines,
    coverFee,
    stallName: DEFAULT_STALL.stallName,
    sellerName: DEFAULT_STALL.sellerName,
  });
}

describe("buildReview", () => {
  it("covers the fee so the step-show menu price is what she keeps", () => {
    const review = reviewFor("step", true);
    expect(review.menuCents).toBe(2850);
    expect(review.stickerCents).toBe(3004);
    expect(review.takeHomeCents).toBeGreaterThanOrEqual(2850);
    expect(review.buyerLine).toContain(formatUSD(3004));
    expect(review.buyerLine).toContain(formatUSD(2850));
    expect(review.bundle?.code).toBe("keep_together");
    expect(review.receipt).toContain("Amina");
    expect(includesMoney(review.receipt, [review.stickerCents, review.feeCents, review.takeHomeCents])).toBe(true);
    expect(canCharge(review, false).ok).toBe(true);
  });

  it("warns that a water alone is mostly fixed fee", () => {
    const review = reviewFor("water", true);
    expect(review.menuCents).toBe(150);
    expect(review.bundle?.code).toBe("small_ticket");
    expect(review.microCheaper).toBe(true);
    expect(review.sellerNote).toContain("4.99%");
    expect(review.takeHomeCents).toBeGreaterThanOrEqual(150);
  });

  it("blocks a screenshot rush until the seller acknowledges the hold", () => {
    const review = reviewFor("screenshot", true);
    expect(review.risk.level).toBe("high");
    expect(canCharge(review, false)).toEqual({
      ok: false,
      reason: "Acknowledge the hold before charging. A screenshot is not a payment.",
    });
    expect(canCharge(review, true).ok).toBe(true);
    expect(review.receipt).toContain("screenshot");
  });

  it("drops model prose that changes the dollars", () => {
    const review = reviewFor("water", true);
    const lied = applyModelProse(review, {
      buyerLine: "It's $1.00. That covers the fee, so I still keep the $1.00 menu price.",
      receipt: "You keep $5.00. The fee was $0.00. They paid $1.00.",
    });
    expect(lied.buyerLine).toBe(review.buyerLine);
    expect(lied.receipt).toBe(review.receipt);
    expect(lied.source).toBe("model");

    const honest = applyModelProse(review, {
      buyerLine: `It's ${formatUSD(review.stickerCents)}. You still keep the ${formatUSD(review.menuCents)} menu price, and the line is a little warmer.`,
      receipt: `Amina, the buyer paid ${formatUSD(review.stickerCents)}. The Checkout fee estimate is ${formatUSD(review.feeCents)}. You keep ${formatUSD(review.takeHomeCents)}.`,
    });
    expect(honest.buyerLine).toContain("warmer");
    expect(honest.receipt).toContain(formatUSD(review.feeCents));
  });

  it("builds a PayPal purchase unit that adds up, including the fee cover", () => {
    const review = reviewFor("step", true);
    const unit = buildPurchaseUnit(review, DEFAULT_STALL.stallName, "sale-1");
    expect(purchaseUnitBalances(unit)).toBe(true);
    expect(unit.items.some((item) => item.name.includes("fee cover"))).toBe(true);
    expect(unit.amount.value).toBe("30.04");
  });

  it("reads a PayPal capture payload", () => {
    const parsed = readCapture({
      id: "ORDER1",
      status: "COMPLETED",
      purchase_units: [
        { payments: { captures: [{ id: "CAP1", status: "COMPLETED", amount: { value: "30.04" } }] } },
      ],
    });
    expect(parsed).toEqual({ orderId: "ORDER1", captureId: "CAP1", status: "COMPLETED", value: "30.04" });
    expect(readCapture({})).toBeNull();
  });

  it("classifies captures so demo and sample never hit PayPal", () => {
    expect(captureKind("SAMPLE-CAP-1", true)).toBe("sample");
    expect(captureKind("DEMO-abc", true)).toBe("demo");
    expect(captureKind("CAP123", false)).toBe("demo");
    expect(captureKind("CAP123", true)).toBe("sandbox");
  });
});

describe("ledger", () => {
  it("splits Eastern Time days", () => {
    const now = new Date("2026-11-10T18:00:00.000Z");
    expect(isSameEtDay("2026-11-10T15:00:00.000Z", now)).toBe(true);
    expect(isSameEtDay("2026-11-10T03:00:00.000Z", now)).toBe(false);
  });

  it("zeroes a full refund and keeps sample sales in today's sum", () => {
    const now = new Date("2026-11-10T18:00:00.000Z");
    const sales = buildSampleEvening(DEFAULT_STALL, now);
    expect(sales).toHaveLength(3);
    expect(sales.every((sale) => sale.lines.length > 0)).toBe(true);
    const before = sumKept(sales, { now });
    expect(before).toBeGreaterThan(0);
    const refunded = {
      ...sales[0],
      refund: { id: "SAMPLE-REFUND-1", cents: sales[0].stickerCents, at: now.toISOString(), note: "Missing plantain", mode: "sample" as const },
    };
    expect(netKeptCents(refunded)).toBe(0);
    expect(sumKept([refunded, ...sales.slice(1)], { now })).toBe(before - sales[0].takeHomeCents);
  });
});
