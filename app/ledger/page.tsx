"use client";

import Link from "next/link";
import { formatUSD } from "@/lib/money";
import { formatWhen, isSameEtDay, netKeptCents, sumKept } from "@/lib/ledger";
import { useStall } from "@/components/stall-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LedgerPage() {
  const { sales, stall, clearSamples, clearSales } = useStall();
  const kept = sumKept(sales);
  const hasSamples = sales.some((sale) => sale.sample);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{stall.stallName}</p>
          <h1 className="mt-1 font-heading text-4xl">Ledger</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Today you kept {formatUSD(kept)}
            {sales.some((sale) => sale.sample && isSameEtDay(sale.createdAt)) ? ", including the sample evening" : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          {hasSamples ? (
            <Button variant="outline" className="h-10" onClick={clearSamples}>
              Clear samples
            </Button>
          ) : null}
          {sales.length > 0 ? (
            <Button variant="ghost" className="h-10" onClick={clearSales}>
              Clear ledger
            </Button>
          ) : null}
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10">
          <p className="font-heading text-2xl">The drawer is empty.</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The first real one usually happens between classes. Load a sample evening from the home till, or ring a
            sale and capture it.
          </p>
          <Link href="/sell" className="mt-4 inline-block text-sm underline underline-offset-2">
            Ring up a sale
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {sales.map((sale) => {
            const keptOnSale = netKeptCents(sale);
            return (
              <li key={sale.id}>
                <Link href={`/receipt/${sale.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-secondary/60">
                  <div>
                    <p className="text-sm font-medium">
                      {sale.lines.map((line) => `${line.qty} ${line.name}`).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatWhen(sale.createdAt)} ET
                      {sale.paypal.mode === "sandbox" ? " · Sandbox" : " · Demo"}
                      {sale.sample ? " · Sample" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {sale.refund ? (
                      <Badge variant="outline">
                        {sale.refund.cents >= sale.stickerCents ? "Refunded" : "Partial refund"}
                      </Badge>
                    ) : null}
                    {sale.risk.level === "high" ? <Badge variant="destructive">Held</Badge> : null}
                    <div className="text-right">
                      <p className="font-heading text-2xl text-keep tabular-nums">{formatUSD(keptOnSale)}</p>
                      <p className="text-xs text-muted-foreground">paid {formatUSD(sale.stickerCents)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
