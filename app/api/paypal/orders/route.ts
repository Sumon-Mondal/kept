import { NextResponse } from "next/server";
import { isCartError, readCartRequest } from "@/lib/cart-request";
import { buildReview, canCharge } from "@/lib/review";
import { createPaypalOrder, paypalConfigured } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the sale as JSON." }, { status: 400 });
  }
  const cart = readCartRequest(body);
  if (isCartError(cart)) return NextResponse.json(cart, { status: 400 });
  const review = buildReview({
    note: cart.note,
    lines: cart.lines,
    coverFee: cart.coverFee,
    stallName: cart.stallName,
    sellerName: cart.sellerName,
  });
  const gate = canCharge(review, cart.acknowledged);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 400 });

  if (!paypalConfigured()) {
    return NextResponse.json({
      mode: "demo",
      orderId: `DEMO-${crypto.randomUUID()}`,
      review,
    });
  }

  try {
    const order = await createPaypalOrder(review, cart.stallName, crypto.randomUUID());
    return NextResponse.json({ mode: "sandbox", orderId: order.id, review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal could not start this order.";
    return NextResponse.json({ error: message, mode: "sandbox" }, { status: 502 });
  }
}
