import { NextResponse } from "next/server";
import { isCartError, readCartRequest } from "@/lib/cart-request";
import { paypalAmount } from "@/lib/paypal-order";
import { capturePaypalOrder, paypalConfigured } from "@/lib/paypal";
import { buildReview, canCharge } from "@/lib/review";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
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

  if (id.startsWith("DEMO-") || !paypalConfigured()) {
    return NextResponse.json({
      mode: "demo",
      orderId: id.startsWith("DEMO-") ? id : `DEMO-${crypto.randomUUID()}`,
      captureId: `DEMO-${crypto.randomUUID()}`,
      status: "COMPLETED",
      review,
    });
  }

  try {
    const captured = await capturePaypalOrder(id, paypalAmount(review.stickerCents));
    return NextResponse.json({ mode: "sandbox", ...captured, review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal could not capture this order.";
    return NextResponse.json({ error: message, mode: "sandbox" }, { status: 502 });
  }
}
