import type { CartLine, Risk, RiskFlag, RiskLevel } from "./types";

type Rule = {
  code: string;
  weight: number;
  title: string;
  detail: string;
  test: RegExp;
};

const RULES: Rule[] = [
  {
    code: "screenshot",
    weight: 50,
    title: "Screenshot",
    detail:
      "They say the money already moved and a screenshot is the proof. It is not. Capture on this page, then hand the order over.",
    test: /screen\s?shot|already paid|proof of payment|payment proof/i,
  },
  {
    code: "friends_family",
    weight: 40,
    title: "Friends and family",
    detail:
      "This is goods or services. A gift payment drops seller protection. Charge it here as a checkout.",
    test: /friends and family|friends & family|\bf&f\b|as a gift|gift payment/i,
  },
  {
    code: "off_platform",
    weight: 24,
    title: "Other app",
    detail:
      "They mentioned a payment app that is not this PayPal checkout. Those messages do not settle this order.",
    test: /zelle|cash app|venmo|apple cash|wire transfer|\bwire\b|bitcoin|crypto/i,
  },
  {
    code: "third_party",
    weight: 12,
    title: "Someone else",
    detail:
      "A roommate, cousin, or friend is in the payment story. Take the money from the person in front of you.",
    test: /cousin|roommate|boyfriend|girlfriend|someone else/i,
  },
  {
    code: "urgency",
    weight: 10,
    title: "Rush",
    detail:
      "The pickup is time-pressed. Rush is normal on a yard. It is also how a fake payment gets handed food.",
    test: /tonight|right now|\basap\b|in an hour|before the|before they leave/i,
  },
];

function levelFor(flags: RiskFlag[], lines: CartLine[]): RiskLevel {
  const codes = new Set(flags.map((flag) => flag.code));
  const bulk = lines.some((line) => line.qty >= 6);
  if (codes.has("screenshot") || codes.has("friends_family")) return "high";
  if (codes.has("off_platform") && codes.has("urgency") && bulk) return "high";
  if (flags.length > 0 || bulk) return "medium";
  return "low";
}

export function assessRisk(note: string, lines: CartLine[]): Risk {
  const flags: RiskFlag[] = RULES.filter((rule) => rule.test.test(note)).map((rule) => ({
    code: rule.code,
    weight: rule.weight,
    title: rule.title,
    detail: rule.detail,
  }));

  if (lines.some((line) => line.qty >= 6) && !flags.some((flag) => flag.code === "bulk")) {
    flags.push({
      code: "bulk",
      weight: 18,
      title: "Big count",
      detail: "This count is large for a walk-up stall. Confirm the items before you charge.",
    });
  }

  const menuCents = lines.reduce((sum, line) => sum + line.qty * line.unitPriceCents, 0);
  if (menuCents >= 15_000) {
    flags.push({
      code: "large_total",
      weight: 12,
      title: "Large total",
      detail: "This is a large total for a stall. Read it back before you hand anything over.",
    });
  }

  const score = Math.min(100, flags.reduce((sum, flag) => sum + flag.weight, 0));
  return { level: levelFor(flags, lines), score, flags };
}

export function mentionsSeparateCheckout(note: string): boolean {
  return /separately|split the payment|their own checkout|second payment|two payments/i.test(note);
}
