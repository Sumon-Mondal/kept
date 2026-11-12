import { formatPercent, formatUSD } from "@/lib/money";
import type { Review } from "@/lib/types";
import type { Stall } from "@/lib/menu";
import { Badge } from "@/components/ui/badge";

const riskCopy = {
  low: { label: "Quiet sale", variant: "secondary" as const },
  medium: { label: "Look twice", variant: "outline" as const },
  high: { label: "Hold the order", variant: "destructive" as const },
};

export function SaleTape({
  review,
  stall,
  empty,
}: {
  review: Review;
  stall: Stall;
  empty?: boolean;
}) {
  const risk = riskCopy[review.risk.level];
  const feeRatio = review.stickerCents > 0 ? review.feeCents / review.stickerCents : 0;

  return (
    <section className="tape overflow-hidden rounded-2xl border border-border bg-card" aria-label="Sale tape">
      <div className="border-b border-dashed border-border px-5 py-4">
        <p className="font-heading text-xl leading-tight">{stall.stallName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {stall.campus} · {stall.city}
        </p>
      </div>

      {empty || review.lines.length === 0 ? (
        <p className="px-5 py-8 text-sm leading-6 text-muted-foreground">
          Nothing on the tape yet. Tap the menu, or read a note the way you would say it at the table.
        </p>
      ) : (
        <div className="space-y-4 px-5 py-4">
          <ul className="space-y-2 text-sm">
            {review.lines.map((line) => (
              <li key={line.key} className="flex items-baseline justify-between gap-3">
                <span>
                  <span className="text-muted-foreground">{line.qty} × </span>
                  {line.name}
                </span>
                <span className="tabular-nums">{formatUSD(line.qty * line.unitPriceCents)}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5 border-t border-dashed border-border pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Menu</dt>
              <dd className="tabular-nums">{formatUSD(review.menuCents)}</dd>
            </div>
            {review.coverFee && review.stickerCents !== review.menuCents ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Fee cover</dt>
                <dd className="tabular-nums">{formatUSD(review.stickerCents - review.menuCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Buyer pays</dt>
              <dd className="tabular-nums">{formatUSD(review.stickerCents)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Est. PayPal Checkout fee</dt>
              <dd className="tabular-nums">
                {formatUSD(review.feeCents)}
                <span className="text-muted-foreground"> · {formatPercent(feeRatio)}</span>
              </dd>
            </div>
            {!review.coverFee ? (
              <div className="flex justify-between gap-3 text-muted-foreground">
                <dt>If you ate the fee</dt>
                <dd className="tabular-nums">You keep {formatUSD(review.takeHomeIfMenuCents)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="border-t border-dashed border-border pt-3">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">You keep</p>
            <p className="font-heading text-5xl leading-none text-keep">{formatUSD(review.takeHomeCents)}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              PayPal Checkout estimate, 3.49% + $0.49. This number is code. The clerk does not invent it.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={risk.variant}>{risk.label}</Badge>
              <Badge variant="outline">{review.source === "model" ? "Model clerk" : "On-device clerk"}</Badge>
            </div>
            {review.risk.flags.length > 0 ? (
              <ul className="space-y-2">
                {review.risk.flags.map((flag) => (
                  <li key={flag.code} className="text-sm leading-5">
                    <span className="font-medium">{flag.title}. </span>
                    <span className="text-muted-foreground">{flag.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No pressure, no screenshot, no second app in the note.</p>
            )}
            {review.bundle ? (
              <p className="rounded-xl bg-secondary px-3 py-2 text-sm leading-5">
                <span className="font-medium">{review.bundle.title}. </span>
                {review.bundle.detail}
              </p>
            ) : null}
            {review.microCheaper && review.menuCents < 2700 ? (
              <p className="text-xs leading-5 text-muted-foreground">
                If PayPal has approved micropayments on this account, the menu total would estimate{" "}
                {formatUSD(review.microFeeCents)} instead of {formatUSD(review.feeIfMenuCents)}. This checkout
                still uses the PayPal Checkout rate.
              </p>
            ) : null}
          </div>

          <blockquote className="border-l-2 border-clay pl-3 text-sm leading-6">
            <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Say this</p>
            <p className="mt-1">{review.buyerLine}</p>
          </blockquote>
        </div>
      )}
    </section>
  );
}
