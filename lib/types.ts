export type RiskLevel = "low" | "medium" | "high";

export type RiskFlag = {
  code: string;
  weight: number;
  title: string;
  detail: string;
};

export type Risk = {
  level: RiskLevel;
  score: number;
  flags: RiskFlag[];
};

export type CartLine = {
  key: string;
  menuId?: string;
  name: string;
  qty: number;
  unitPriceCents: number;
};

export type BundleAdvice = {
  code: "small_ticket" | "keep_together";
  title: string;
  detail: string;
  wasteCents?: number;
};

export type ClerkSource = "on-device" | "model";

export type Review = {
  lines: CartLine[];
  note: string;
  menuCents: number;
  stickerCents: number;
  feeCents: number;
  takeHomeCents: number;
  coverFee: boolean;
  feeIfMenuCents: number;
  takeHomeIfMenuCents: number;
  microFeeCents: number;
  microCheaper: boolean;
  risk: Risk;
  bundle: BundleAdvice | null;
  buyerLine: string;
  sellerNote: string;
  receipt: string;
  source: ClerkSource;
};

export type PayPalMode = "demo" | "sandbox";

export type SaleRecord = {
  id: string;
  createdAt: string;
  sample?: boolean;
  stallName: string;
  sellerName: string;
  campus: string;
  note: string;
  lines: CartLine[];
  coverFee: boolean;
  menuCents: number;
  stickerCents: number;
  feeCents: number;
  takeHomeCents: number;
  risk: Risk;
  bundle: BundleAdvice | null;
  buyerLine: string;
  receipt: string;
  source: ClerkSource;
  paypal: {
    mode: PayPalMode;
    orderId: string;
    captureId: string;
    status: string;
  };
  refund?: {
    id: string;
    cents: number;
    at: string;
    note: string;
    mode: "demo" | "sandbox" | "sample";
  };
};
