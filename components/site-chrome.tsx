"use client";

import Link from "next/link";
import { TillMark } from "@/components/till-mark";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <Link href="/" className="flex items-center gap-2.5 text-foreground">
        <TillMark className="size-8" />
        <span className="font-heading text-2xl leading-none tracking-tight">kept</span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link href="/sell" className="rounded-full px-3 py-2 hover:bg-secondary">
          Ring up
        </Link>
        <Link href="/ledger" className="rounded-full px-3 py-2 hover:bg-secondary">
          Ledger
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 space-y-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
      <p>
        Built by Sumon Mondal at Livingstone College for the PayPal AI Hackathon. Amina Blake and the yard
        kitchen are sample data. Checkout runs in the PayPal sandbox, or as a labeled demo on this device.
      </p>
      <p>
        Fee estimates use PayPal&apos;s published US commercial rate for PayPal Checkout, 3.49% + $0.49, from
        the{" "}
        <a
          className="underline underline-offset-2"
          href="https://www.paypal.com/us/business/paypal-business-fees"
        >
          fee page dated November 4, 2026
        </a>
        . Micropayments (4.99% + $0.09) appear only as a comparison, and only if that pricing would be cheaper.
        Your account can differ. The language model never calculates the fee.
      </p>
    </footer>
  );
}
