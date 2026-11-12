import { DEFAULT_MENU, type Stall } from "./menu";
import { linesFromNote } from "./parse";
import { buildReview } from "./review";
import type { SaleRecord } from "./types";

function hoursAgo(hours: number, now: Date): string {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

const DRAFTS = [
  {
    note: "Two jollof plates and extra plantain for the table by the library.",
    order: "SAMPLE-ORDER-1",
    capture: "SAMPLE-CAP-1",
    hours: 5,
  },
  {
    note: "One org tee for the step team manager.",
    order: "SAMPLE-ORDER-2",
    capture: "SAMPLE-CAP-2",
    hours: 3,
  },
  {
    note: "An edge control tin.",
    order: "SAMPLE-ORDER-3",
    capture: "SAMPLE-CAP-3",
    hours: 1,
  },
] as const;

export function buildSampleEvening(stall: Stall, now: Date = new Date()): SaleRecord[] {
  return DRAFTS.map((draft, index) => {
    const lines = linesFromNote(draft.note, DEFAULT_MENU);
    if (lines.length === 0) {
      throw new Error(`Sample note did not parse: ${draft.note}`);
    }
    const review = buildReview({
      note: draft.note,
      lines,
      coverFee: true,
      stallName: stall.stallName,
      sellerName: stall.sellerName,
    });
    return {
      id: `sample-${index + 1}`,
      createdAt: hoursAgo(draft.hours, now),
      sample: true,
      stallName: stall.stallName,
      sellerName: stall.sellerName,
      campus: stall.campus,
      note: draft.note,
      lines: review.lines,
      coverFee: true,
      menuCents: review.menuCents,
      stickerCents: review.stickerCents,
      feeCents: review.feeCents,
      takeHomeCents: review.takeHomeCents,
      risk: review.risk,
      bundle: review.bundle,
      buyerLine: review.buyerLine,
      receipt: review.receipt,
      source: "on-device" as const,
      paypal: {
        mode: "demo" as const,
        orderId: draft.order,
        captureId: draft.capture,
        status: "COMPLETED",
      },
    };
  });
}
