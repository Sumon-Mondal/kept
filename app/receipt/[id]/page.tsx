"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { centsToInput, formatUSD, parseDollarInput } from "@/lib/money";
import { netKeptCents } from "@/lib/ledger";
import { useStall } from "@/components/stall-provider";
import { SaleTape } from "@/components/sale-tape";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildReview } from "@/lib/review";

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const { sales, stall, ready, updateSale } = useStall();
  const sale = sales.find((item) => item.id === params.id);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(sale ? centsToInput(sale.stickerCents) : "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <p className="text-sm text-muted-foreground">Finding the receipt…</p>;

  if (!sale) {
    return (
      <div className="max-w-lg space-y-3">
        <h1 className="font-heading text-4xl">That receipt is not on this device.</h1>
        <Link href="/ledger" className="text-sm underline underline-offset-2">
          Back to the ledger
        </Link>
      </div>
    );
  }

  const review = buildReview({
    note: sale.note,
    lines: sale.lines,
    coverFee: sale.coverFee,
    stallName: sale.stallName,
    sellerName: sale.sellerName,
    source: sale.source,
  });
  review.buyerLine = sale.buyerLine;
  review.receipt = sale.receipt;
  review.risk = sale.risk;
  review.bundle = sale.bundle;
  review.stickerCents = sale.stickerCents;
  review.feeCents = sale.feeCents;
  review.takeHomeCents = sale.takeHomeCents;
  review.menuCents = sale.menuCents;

  async function refund() {
    if (!sale) return;
    const cents = parseDollarInput(amount);
    if (cents == null || cents <= 0 || cents > sale.stickerCents) {
      setError(`Enter an amount up to ${formatUSD(sale.stickerCents)}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/paypal/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId: sale.paypal.captureId,
          amountCents: cents,
          note,
        }),
      });
      const data = (await response.json()) as {
        refundId?: string;
        mode?: "demo" | "sandbox" | "sample";
        error?: string;
      };
      if (!response.ok || !data.refundId || !data.mode) {
        setError(data.error || "The refund did not go through.");
        return;
      }
      updateSale(sale.id, (current) => ({
        ...current,
        refund: {
          id: data.refundId!,
          cents,
          at: new Date().toISOString(),
          note: note.trim() || "Refund",
          mode: data.mode!,
        },
      }));
      setOpen(false);
    } catch {
      setError("The till could not reach the refund route.");
    } finally {
      setBusy(false);
    }
  }

  const kept = netKeptCents(sale);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Receipt</p>
          <h1 className="mt-1 font-heading text-4xl leading-tight">You kept {formatUSD(kept)}.</h1>
        </div>
        <p className="text-base leading-7">{sale.receipt}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{sale.paypal.mode === "sandbox" ? "PayPal sandbox" : "Demo capture"}</Badge>
          {sale.sample ? <Badge variant="secondary">Sample</Badge> : null}
          {sale.refund ? <Badge variant="outline">Refund {formatUSD(sale.refund.cents)}</Badge> : null}
          <Badge variant="outline">{sale.source === "model" ? "Model clerk" : "On-device clerk"}</Badge>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="max-w-[16rem] truncate font-mono text-xs">{sale.paypal.orderId}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Capture</dt>
            <dd className="max-w-[16rem] truncate font-mono text-xs">{sale.paypal.captureId}</dd>
          </div>
          {sale.refund ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Refund</dt>
              <dd className="text-right text-xs">
                {sale.refund.id}
                <span className="mt-1 block text-muted-foreground">{sale.refund.note}</span>
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="text-xs leading-5 text-muted-foreground">
          A full refund clears this row on the till. PayPal may still retain part of the original fee on a real
          capture. Check the transaction in the sandbox account.
        </p>
        {!sale.refund ? (
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (next) {
                setAmount(centsToInput(sale.stickerCents));
                setError(null);
              }
            }}
          >
            <DialogTrigger render={<Button variant="outline" className="h-10" />}>Refund this sale</DialogTrigger>
            <DialogContent className="sm:!max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Refund</DialogTitle>
                <DialogDescription>
                  {sale.sample
                    ? "Sample sales update the till only. Nothing is sent to PayPal."
                    : sale.paypal.mode === "sandbox"
                      ? "This calls the PayPal refund API for the sandbox capture."
                      : "Demo captures refund on this device and are marked Demo."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="refund-amount">Amount</Label>
                  <Input
                    id="refund-amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="refund-note">Note to the buyer</Label>
                  <Textarea
                    id="refund-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="The extra plantain didn't make the plate."
                  />
                </div>
                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button onClick={() => void refund()} disabled={busy} className="h-10">
                  {busy ? "Refunding…" : "Send refund"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
        <Link href="/ledger" className="block text-sm underline underline-offset-2">
          Back to the ledger
        </Link>
      </section>
      <SaleTape
        review={review}
        stall={{
          sellerName: sale.sellerName,
          stallName: sale.stallName,
          campus: sale.campus,
          city: stall.city,
          goalCents: stall.goalCents,
        }}
      />
    </div>
  );
}
