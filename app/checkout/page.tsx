"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStall } from "@/components/stall-provider";
import { PayPalCheckout, type ChargeBody, type PaidPayload } from "@/components/paypal-checkout";
import { SaleTape } from "@/components/sale-tape";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { buildReview, canCharge } from "@/lib/review";
import { clearPending, loadPending, type PendingSale } from "@/lib/storage";
import type { CartLine } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { stall, menu, ready, addSale } = useStall();
  const [pending, setPending] = useState<PendingSale | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [mode, setMode] = useState<"demo" | "sandbox" | "loading">("loading");
  const [clientId, setClientId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = loadPending();
    setPending(stored);
    setAcknowledged(Boolean(stored?.acknowledged));
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetch("/api/capabilities")
      .then((response) => response.json())
      .then((data: { paypal?: string; clientId?: string | null }) => {
        setMode(data.paypal === "sandbox" && data.clientId ? "sandbox" : "demo");
        setClientId(data.clientId ?? null);
      })
      .catch(() => {
        setMode("demo");
        setClientId(null);
      });
  }, []);

  const lines = useMemo<CartLine[]>(() => {
    if (!pending) return [];
    return pending.lines.map((line) => {
      if (!line.menuId) return line;
      const item = menu.find((entry) => entry.id === line.menuId);
      if (!item) return line;
      return { ...line, name: item.name, unitPriceCents: item.priceCents };
    });
  }, [pending, menu]);

  const review = useMemo(
    () =>
      buildReview({
        note: pending?.note ?? "",
        lines,
        coverFee: pending?.coverFee !== false,
        stallName: stall.stallName,
        sellerName: stall.sellerName,
      }),
    [pending, lines, stall.stallName, stall.sellerName],
  );

  const gate = canCharge(review, acknowledged);

  const body = useMemo<ChargeBody>(
    () => ({
      note: pending?.note ?? "",
      lines,
      coverFee: pending?.coverFee !== false,
      acknowledged,
      stallName: stall.stallName,
      sellerName: stall.sellerName,
      campus: stall.campus,
      menuPrices: menu.map((item) => ({ id: item.id, priceCents: item.priceCents })),
    }),
    [pending, lines, acknowledged, stall, menu],
  );

  function onPaid(paid: PaidPayload) {
    if (saving) return;
    setSaving(true);
    const saleId = crypto.randomUUID();
    addSale({
      id: saleId,
      createdAt: new Date().toISOString(),
      stallName: stall.stallName,
      sellerName: stall.sellerName,
      campus: stall.campus,
      note: pending?.note ?? "",
      lines: paid.review.lines,
      coverFee: pending?.coverFee !== false,
      menuCents: paid.review.menuCents,
      stickerCents: paid.review.stickerCents,
      feeCents: paid.review.feeCents,
      takeHomeCents: paid.review.takeHomeCents,
      risk: paid.review.risk,
      bundle: paid.review.bundle,
      buyerLine: paid.review.buyerLine,
      receipt: paid.review.receipt,
      source: paid.review.source,
      paypal: {
        mode: paid.mode,
        orderId: paid.orderId,
        captureId: paid.captureId,
        status: paid.status,
      },
    });
    clearPending();
    router.push(`/receipt/${saleId}`);
  }

  if (!loaded || !ready) {
    return <p className="text-sm text-muted-foreground">Opening the checkout…</p>;
  }

  if (!pending || pending.lines.length === 0) {
    return (
      <div className="max-w-lg space-y-3">
        <h1 className="font-heading text-4xl">Nothing waiting to charge.</h1>
        <p className="text-muted-foreground">Ring up a sale first. The checkout only opens from a tape you already priced.</p>
        <Link href="/sell" className="inline-block text-sm underline underline-offset-2">
          Back to the till
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <section className="space-y-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Checkout</p>
          <h1 className="mt-1 font-heading text-4xl">Take the payment.</h1>
        </div>
        {review.risk.level === "high" ? (
          <label className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-card px-3 py-3 text-sm leading-5">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              className="mt-0.5 size-5"
            />
            <span>I will wait for a PayPal capture before I hand this over. A screenshot does not settle it.</span>
          </label>
        ) : null}
        {gate.ok ? (
          <PayPalCheckout body={body} mode={mode} clientId={clientId} onPaid={onPaid} />
        ) : (
          <p className="text-sm text-muted-foreground">{gate.reason}</p>
        )}
        <Button variant="ghost" className="h-10 px-0" onClick={() => router.push("/sell")}>
          Back to the tape
        </Button>
      </section>
      <SaleTape review={review} stall={stall} />
    </div>
  );
}
