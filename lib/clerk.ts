import { formatUSD } from "./money";
import { linesFromModel } from "./parse";
import { applyModelProse, buildReview } from "./review";
import { aiConfigured, interpretWithModel } from "./llm";
import type { CartRequest } from "./cart-request";
import type { CartLine, Review } from "./types";

function signature(lines: CartLine[]): string {
  return lines.map((line) => `${line.menuId ?? line.name}:${line.qty}:${line.unitPriceCents}`).join("|");
}

export async function priceWithClerk(request: CartRequest): Promise<{ review: Review; warning?: string }> {
  const base = buildReview({
    note: request.note,
    lines: request.lines,
    coverFee: request.coverFee,
    stallName: request.stallName,
    sellerName: request.sellerName,
    source: "on-device",
  });

  if (!aiConfigured() || !request.note.trim()) return { review: base };

  try {
    const draft = await interpretWithModel({
      note: request.note,
      menu: request.menu,
      lines: request.lines.map((line) => ({ menuId: line.menuId, name: line.name, qty: line.qty })),
      sellerName: request.sellerName,
      stallName: request.stallName,
      sticker: formatUSD(base.stickerCents),
      fee: formatUSD(base.feeCents),
      takeHome: formatUSD(base.takeHomeCents),
      menuTotal: formatUSD(base.menuCents),
      flags: base.risk.flags.map((flag) => flag.code),
    });
    const modeled = linesFromModel(draft.lines, request.menu);
    const lines = modeled.lines.length > 0 ? modeled.lines : request.lines;
    let review = buildReview({
      note: request.note,
      lines,
      coverFee: request.coverFee,
      stallName: request.stallName,
      sellerName: request.sellerName,
      source: "model",
    });
    if (signature(lines) === signature(request.lines)) {
      review = applyModelProse(review, draft);
    }
    return { review };
  } catch (error) {
    console.error("Kept model clerk failed:", error instanceof Error ? error.message : "unknown");
    return { review: base, warning: "model_unavailable" };
  }
}
