import { NextResponse } from "next/server";
import { captureKind } from "@/lib/paypal-order";
import { paypalConfigured, refundPaypalCapture } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the refund as JSON." }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  const captureId = typeof record.captureId === "string" ? record.captureId : "";
  const amountCents = Number(record.amountCents);
  const note = typeof record.note === "string" ? record.note.slice(0, 255) : "";
  if (!captureId || !Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 500_000) {
    return NextResponse.json({ error: "Refund needs a capture and an amount." }, { status: 400 });
  }

  const kind = captureKind(captureId, paypalConfigured());
  if (kind === "sample") {
    return NextResponse.json({
      mode: "sample",
      refundId: `SAMPLE-REFUND-${crypto.randomUUID()}`,
      status: "COMPLETED",
    });
  }
  if (kind === "demo") {
    return NextResponse.json({
      mode: "demo",
      refundId: `DEMO-REFUND-${crypto.randomUUID()}`,
      status: "COMPLETED",
    });
  }

  try {
    const refund = await refundPaypalCapture(captureId, amountCents, note);
    return NextResponse.json({ mode: "sandbox", refundId: refund.id, status: refund.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal could not refund this capture.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
