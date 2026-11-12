import { describe, expect, it } from "vitest";
import {
  checkoutFeeCents,
  feeCentsFor,
  formatUSD,
  microFeeCents,
  parseDollarInput,
  stickerForTakeHome,
  takeHomeCents,
  variableFeeCents,
} from "./money";
import { CHECKOUT_FEE, MICRO_FEE } from "./money";

describe("checkout fee", () => {
  it("uses 3.49% plus 49 cents on a $12 plate", () => {
    expect(variableFeeCents(1200, 349)).toBe(42);
    expect(checkoutFeeCents(1200)).toBe(91);
    expect(takeHomeCents(1200)).toBe(1109);
    expect(formatUSD(1109)).toBe("$11.09");
  });

  it("shows how hard the fixed fee hits a $1.50 water", () => {
    expect(checkoutFeeCents(150)).toBe(54);
    expect(Math.round((54 / 150) * 100)).toBe(36);
  });

  it("prices the step-show menu total", () => {
    expect(checkoutFeeCents(2850)).toBe(148);
  });

  it("rounds half-up on an exact half cent of percentage", () => {
    let found = 0;
    for (let amount = 1; amount <= 20000; amount += 1) {
      if ((amount * 349) % 10000 === 5000) {
        found = amount;
        break;
      }
    }
    expect(found).toBeGreaterThan(0);
    const integer = variableFeeCents(found, 349);
    const rounded = Math.round((found * 349) / 10000);
    expect(integer).toBe(rounded);
  });

  it("finds a sticker that clears the menu price after the fee", () => {
    for (const target of [150, 1200, 2850, 800]) {
      const sticker = stickerForTakeHome(target);
      expect(takeHomeCents(sticker)).toBeGreaterThanOrEqual(target);
      expect(takeHomeCents(sticker - 1)).toBeLessThan(target);
    }
    expect(stickerForTakeHome(2850)).toBe(3004);
    expect(checkoutFeeCents(3004)).toBe(154);
  });

  it("prices micropayments cheaper on a water and not on a $28.50 tab", () => {
    expect(microFeeCents(150)).toBe(16);
    expect(microFeeCents(150)).toBeLessThan(checkoutFeeCents(150));
    expect(microFeeCents(2850)).toBeGreaterThan(checkoutFeeCents(2850));
    expect(feeCentsFor(150, MICRO_FEE)).toBe(16);
    expect(CHECKOUT_FEE.fixedCents).toBe(49);
  });

  it("parses dollar inputs", () => {
    expect(parseDollarInput("$12.50")).toBe(1250);
    expect(parseDollarInput("12.5")).toBe(1250);
    expect(parseDollarInput("0.49")).toBe(49);
    expect(parseDollarInput("12.555")).toBeNull();
    expect(parseDollarInput("")).toBeNull();
  });
});
