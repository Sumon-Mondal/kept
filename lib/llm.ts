import type { MenuItem } from "./menu";

const SYSTEM = `You are the clerk inside Kept, a till for campus sellers.
Return one JSON object and nothing else.
You may correct which menu items and quantities the note describes.
You may add a custom line only when the note names something that is not on the menu and states a dollar price.
You cannot change the price of a menu item. Omit prices on menu lines.
buyerLine is one or two sentences the seller can say out loud to the buyer.
receipt is three or four sentences in past tense, addressed to the seller by first name, as if the PayPal payment already happened.
If you keep the lines you were given, buyerLine and receipt MUST include the exact dollar strings provided, character for character.
If you change the lines, set buyerLine and receipt to empty strings.
Do not invent a different fee. Do not give advice about screenshots beyond what the flags already say.`;

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY?.trim());
}

export function aiModelName(): string {
  return process.env.AI_MODEL?.trim() || "gpt-4o-mini";
}

export type ModelDraft = {
  lines: unknown;
  buyerLine: string;
  receipt: string;
};

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to fenced or sliced JSON
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return JSON.parse(fence[1]);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error("Model did not return JSON.");
}

export function parseDraft(value: unknown): ModelDraft {
  if (!value || typeof value !== "object") throw new Error("Model JSON was empty.");
  const record = value as Record<string, unknown>;
  return {
    lines: record.lines,
    buyerLine: typeof record.buyerLine === "string" ? record.buyerLine : "",
    receipt: typeof record.receipt === "string" ? record.receipt : "",
  };
}

function menuList(menu: MenuItem[]): string {
  return menu
    .map((item) => `${item.id} | ${item.name} | ${(item.priceCents / 100).toFixed(2)} | aliases: ${item.aliases.join(", ")}`)
    .join("\n");
}

export function modelUserPrompt(input: {
  note: string;
  menu: MenuItem[];
  lines: { menuId?: string; name: string; qty: number }[];
  sellerName: string;
  stallName: string;
  sticker: string;
  fee: string;
  takeHome: string;
  menuTotal: string;
  flags: string[];
}): string {
  return [
    `Seller: ${input.sellerName}`,
    `Stall: ${input.stallName}`,
    `Note: ${input.note}`,
    `Parsed lines (change these only if the note disagrees): ${JSON.stringify(input.lines)}`,
    `Menu:\n${menuList(input.menu)}`,
    `Money, already computed, valid only for the parsed lines:`,
    `buyer pays ${input.sticker}`,
    `menu total ${input.menuTotal}`,
    `estimated PayPal Checkout fee ${input.fee}`,
    `seller keeps ${input.takeHome}`,
    `Risk flags: ${input.flags.join(", ") || "none"}`,
    `JSON shape: {"lines":[{"menuId":"jerk","qty":2}],"buyerLine":"...","receipt":"..."}`,
  ].join("\n");
}

export async function interpretWithModel(
  input: Parameters<typeof modelUserPrompt>[0],
  fetchImpl: typeof fetch = fetch,
): Promise<ModelDraft> {
  const key = process.env.AI_API_KEY?.trim();
  if (!key) throw new Error("AI_API_KEY is not set.");
  const base = (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetchImpl(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModelName(),
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: modelUserPrompt(input) },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`Model request failed (${response.status}).`);
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("Model returned an empty reply.");
    return parseDraft(extractJson(text));
  } finally {
    clearTimeout(timer);
  }
}
