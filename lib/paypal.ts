import { paypalAmount } from "./paypal-order";
import type { Review } from "./types";
import { buildPurchaseUnit, orderCreateBody, readCapture } from "./paypal-order";

const SANDBOX = "https://api-m.sandbox.paypal.com";

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}

export function paypalClientId(): string | null {
  if (!paypalConfigured()) return null;
  return process.env.PAYPAL_CLIENT_ID!.trim();
}

type Token = { value: string; exp: number };
let token: Token | null = null;

async function paypalError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string;
      error_description?: string;
      details?: { description?: string }[];
    };
    const detail = body.details?.map((item) => item.description).filter(Boolean).join(" ");
    return detail || body.message || body.error_description || `PayPal returned ${response.status}.`;
  } catch {
    return `PayPal returned ${response.status}.`;
  }
}

export async function getAccessToken(fetchImpl: typeof fetch = fetch): Promise<string> {
  if (token && token.exp > Date.now() + 15_000) return token.value;
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("PayPal sandbox keys are not set.");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const response = await fetchImpl(`${SANDBOX}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await paypalError(response));
  }
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("PayPal did not return an access token.");
  token = {
    value: json.access_token,
    exp: Date.now() + (json.expires_in ?? 300) * 1000,
  };
  return token.value;
}

export function clearPaypalToken(): void {
  token = null;
}

export async function createPaypalOrder(
  review: Review,
  stallName: string,
  customId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string }> {
  const access = await getAccessToken(fetchImpl);
  const unit = buildPurchaseUnit(review, stallName, customId);
  const response = await fetchImpl(`${SANDBOX}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(orderCreateBody(unit)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await paypalError(response));
  const json = (await response.json()) as { id?: string };
  if (!json.id) throw new Error("PayPal did not return an order id.");
  return { id: json.id };
}

export async function capturePaypalOrder(
  orderId: string,
  expectedValue: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ orderId: string; captureId: string; status: string; value: string }> {
  const access = await getAccessToken(fetchImpl);
  const response = await fetchImpl(`${SANDBOX}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: "{}",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await paypalError(response));
  const parsed = readCapture(await response.json());
  if (!parsed) throw new Error("PayPal captured the order without a capture id.");
  if (parsed.value !== expectedValue) {
    throw new Error(`PayPal captured ${parsed.value}, and this sale is ${expectedValue}.`);
  }
  if (parsed.status !== "COMPLETED" && parsed.status !== "PENDING") {
    throw new Error(`PayPal capture status is ${parsed.status}.`);
  }
  return parsed;
}

export async function refundPaypalCapture(
  captureId: string,
  amountCents: number,
  note: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; status: string }> {
  const access = await getAccessToken(fetchImpl);
  const response = await fetchImpl(`${SANDBOX}/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { currency_code: "USD", value: paypalAmount(amountCents) },
      note_to_payer: note.slice(0, 255) || "Refund from Kept",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await paypalError(response));
  const json = (await response.json()) as { id?: string; status?: string };
  if (!json.id) throw new Error("PayPal did not return a refund id.");
  return { id: json.id, status: json.status ?? "COMPLETED" };
}
