import { NextResponse } from "next/server";
import { isCartError, readCartRequest } from "@/lib/cart-request";
import { priceWithClerk } from "@/lib/clerk";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the note as JSON." }, { status: 400 });
  }
  const cart = readCartRequest(
    body && typeof body === "object" ? { ...(body as object), rebuildFromNote: true } : body,
  );
  if (isCartError(cart)) return NextResponse.json(cart, { status: 400 });
  const priced = await priceWithClerk(cart);
  return NextResponse.json(priced);
}
