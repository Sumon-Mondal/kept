"use client";

import { useMemo, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { CartLine, Review } from "@/lib/types";
import { Button } from "@/components/ui/button";

export type ChargeBody = {
  note: string;
  lines: CartLine[];
  coverFee: boolean;
  acknowledged: boolean;
  stallName: string;
  sellerName: string;
  campus: string;
  menuPrices: { id: string; priceCents: number }[];
};

export type PaidPayload = {
  mode: "demo" | "sandbox";
  orderId: string;
  captureId: string;
  status: string;
  review: Review;
};

async function postJson(url: string, body: ChargeBody) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as PaidPayload & { error?: string; orderId?: string; mode?: string };
  return { response, data };
}

export function PayPalCheckout({
  body,
  mode,
  clientId,
  onPaid,
}: {
  body: ChargeBody;
  mode: "demo" | "sandbox" | "loading";
  clientId: string | null;
  onPaid: (paid: PaidPayload) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const options = useMemo(
    () => ({
      clientId: clientId ?? "test",
      currency: "USD",
      intent: "capture",
      disableFunding: "card,paylater,venmo,credit",
    }),
    [clientId],
  );

  async function captureDemo() {
    setBusy(true);
    setError(null);
    try {
      const created = await postJson("/api/paypal/orders", body);
      if (!created.response.ok || !created.data.orderId) {
        setError(created.data.error || "Could not open a demo order.");
        return;
      }
      const captured = await postJson(`/api/paypal/orders/${created.data.orderId}/capture`, body);
      if (!captured.response.ok || !captured.data.captureId) {
        setError(captured.data.error || "Could not capture the demo order.");
        return;
      }
      onPaid(captured.data);
    } catch {
      setError("The till could not reach its own checkout route.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {mode === "loading" ? <p className="text-sm text-muted-foreground">Checking PayPal…</p> : null}

      {mode === "sandbox" && clientId ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            PayPal sandbox. Sign in with a personal sandbox buyer. This button does not move live money.
          </p>
          <PayPalScriptProvider options={options}>
            <PayPalButtons
              style={{ layout: "vertical", shape: "rect", label: "paypal", color: "gold" }}
              createOrder={async () => {
                const created = await postJson("/api/paypal/orders", body);
                if (!created.response.ok || !created.data.orderId || created.data.mode === "demo") {
                  const message = created.data.error || "PayPal did not open an order.";
                  setError(message);
                  throw new Error(message);
                }
                return created.data.orderId;
              }}
              onApprove={async (data) => {
                const captured = await postJson(`/api/paypal/orders/${data.orderID}/capture`, body);
                if (!captured.response.ok || !captured.data.captureId) {
                  setError(captured.data.error || "PayPal could not capture this order.");
                  return;
                }
                onPaid(captured.data);
              }}
              onError={(paypalError) => {
                const message = paypalError instanceof Error ? paypalError.message : "PayPal hit an error.";
                setError(message);
              }}
              onCancel={() => setError("Checkout was cancelled before capture.")}
            />
          </PayPalScriptProvider>
        </div>
      ) : null}

      {mode === "demo" ? (
        <div className="space-y-2">
          <Button onClick={captureDemo} disabled={busy} className="h-12 w-full text-base">
            {busy ? "Capturing…" : "Capture demo payment"}
          </Button>
          <p className="text-sm leading-5 text-muted-foreground">
            Sandbox keys are not set. This capture stays in the browser and is marked Demo. The fee math and the
            hold rules are the same ones a sandbox charge uses.
          </p>
        </div>
      ) : null}

      {mode === "sandbox" ? (
        <Button variant="outline" onClick={captureDemo} disabled={busy} className="h-10 w-full">
          {busy ? "Capturing…" : "Sandbox failing? Capture a demo instead"}
        </Button>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
