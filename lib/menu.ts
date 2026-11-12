export type MenuItem = {
  id: string;
  name: string;
  priceCents: number;
  aliases: string[];
  blurb: string;
};

export type Stall = {
  sellerName: string;
  stallName: string;
  campus: string;
  city: string;
  goalCents: number;
};

export const DEFAULT_STALL: Stall = {
  sellerName: "Amina Blake",
  stallName: "Amina's Yard Kitchen",
  campus: "Livingstone College",
  city: "Salisbury, NC",
  goalCents: 8000,
};

/**
 * Sample stall. Amina Blake is fictional. The menu is the kind of mix
 * Sumon sees sold between classes: plates, a club tee, a study hour.
 */
export const DEFAULT_MENU: MenuItem[] = [
  {
    id: "jerk",
    name: "Jerk chicken plate",
    priceCents: 1200,
    aliases: ["jerk chicken plates", "jerk chicken plate", "jerk plates", "jerk plate", "jerk chicken", "jerk"],
    blurb: "Rice, cabbage, and chicken.",
  },
  {
    id: "jollof",
    name: "Jollof plate",
    priceCents: 1100,
    aliases: ["jollof plates", "jollof plate", "jollof"],
    blurb: "The one people text about.",
  },
  {
    id: "plantain",
    name: "Extra plantain",
    priceCents: 300,
    aliases: ["extra plantains", "extra plantain", "plantains", "plantain"],
    blurb: "Sweet, on the side.",
  },
  {
    id: "water",
    name: "Bottled water",
    priceCents: 150,
    aliases: ["bottled waters", "bottled water", "waters", "water"],
    blurb: "The fixed fee hates this one.",
  },
  {
    id: "tee",
    name: "Org tee",
    priceCents: 2200,
    aliases: ["org tees", "org tee", "t shirts", "t shirt", "tees", "tee"],
    blurb: "Campus org print.",
  },
  {
    id: "study",
    name: "Study session (1 hr)",
    priceCents: 2000,
    aliases: ["study sessions", "study session", "tutoring hour", "tutoring", "study"],
    blurb: "One hour, one subject.",
  },
  {
    id: "edge",
    name: "Edge control tin",
    priceCents: 800,
    aliases: ["edge control tins", "edge control tin", "edge control", "edge"],
    blurb: "Small tin, counter sale.",
  },
];

export function menuFromPrices(overrides: Record<string, number> | undefined): MenuItem[] {
  if (!overrides) return DEFAULT_MENU.map((item) => ({ ...item }));
  return DEFAULT_MENU.map((item) => {
    const price = overrides[item.id];
    if (!Number.isInteger(price) || price < 50 || price > 500_000) return { ...item };
    return { ...item, priceCents: price };
  });
}

export function priceMap(menu: MenuItem[]): Record<string, number> {
  return Object.fromEntries(menu.map((item) => [item.id, item.priceCents]));
}
