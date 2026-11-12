"use client";

import Link from "next/link";
import { checkoutFeeCents, formatUSD } from "@/lib/money";
import { isSameEtDay, sumKept } from "@/lib/ledger";
import { useStall } from "@/components/stall-provider";
import { StallDialog } from "@/components/stall-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export default function HomePage() {
  const { stall, sales, ready, loadSamples, clearSamples } = useStall();
  const kept = sumKept(sales);
  const today = sales.filter((sale) => isSameEtDay(sale.createdAt));
  const samples = today.some((sale) => sale.sample);
  const goal = stall.goalCents;
  const ratio = goal > 0 ? Math.min(1, kept / goal) : 0;
  const plateFee = checkoutFeeCents(1200);
  const plateKeep = 1200 - plateFee;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <section>
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
          {stall.campus} · {stall.city}
        </p>
        <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[1.05] text-balance sm:text-6xl">
          The till that tells you what you keep.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          {stall.sellerName} rings up {stall.stallName} from a sentence. Kept prices the PayPal Checkout fee
          before anyone pays, and it holds an order that shows up as a screenshot.
        </p>

        <div className="mt-8">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Today, you kept</p>
          <p className="mt-1 font-heading text-7xl leading-none text-keep tabular-nums">{formatUSD(kept)}</p>
          {goal > 0 ? (
            <div className="mt-4 max-w-md">
              <div className="h-2 overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-keep" style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatUSD(kept)} of a {formatUSD(goal)} keep goal
                {samples ? " · includes a sample evening" : ""}
                {!ready ? "" : today.length === 0 ? " · nothing captured yet" : ` · ${today.length} sale${today.length === 1 ? "" : "s"}`}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sell"
            className={cn(buttonVariants({ size: "lg" }), "h-12 bg-clay px-5 text-base text-clay-foreground hover:bg-clay/90")}
          >
            Ring up a sale
          </Link>
          <Button variant="outline" className="h-12 px-5" onClick={loadSamples}>
            Load a sample evening
          </Button>
          {samples ? (
            <Button variant="ghost" className="h-12" onClick={clearSamples}>
              Clear samples
            </Button>
          ) : null}
          <StallDialog />
        </div>
      </section>

      <aside className="rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_-36px_rgba(40,30,20,0.45)]">
        <p className="font-heading text-2xl leading-tight">A $12 plate keeps {formatUSD(plateKeep)}.</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          PayPal Checkout&apos;s published US rate is 3.49% + $0.49. On a $12 plate the estimate is{" "}
          {formatUSD(plateFee)}. The $0.49 does not shrink when the ticket does. A $1.50 water estimates $0.54 in
          fees. Kept puts that on the tape before the food leaves the table.
        </p>
        <ol className="mt-5 space-y-3 text-sm leading-6">
          <li>
            <span className="font-medium">Say the sale. </span>
            <span className="text-muted-foreground">A note becomes a cart. Menu prices stay the menu prices.</span>
          </li>
          <li>
            <span className="font-medium">Choose who eats the fee. </span>
            <span className="text-muted-foreground">
              Cover it, and the buyer pays enough that you keep the menu total. Or charge the menu price and watch
              the take-home drop.
            </span>
          </li>
          <li>
            <span className="font-medium">Capture, then hand it over. </span>
            <span className="text-muted-foreground">
              A screenshot, a cousin, or another app does not settle the order. The PayPal capture does.
            </span>
          </li>
        </ol>
      </aside>
    </div>
  );
}
