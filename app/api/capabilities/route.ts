import { NextResponse } from "next/server";
import { aiConfigured, aiModelName } from "@/lib/llm";
import { paypalClientId, paypalConfigured } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export function GET() {
  const paypal = paypalConfigured();
  return NextResponse.json({
    paypal: paypal ? "sandbox" : "demo",
    clientId: paypalClientId(),
    ai: aiConfigured(),
    model: aiConfigured() ? aiModelName() : null,
  });
}
