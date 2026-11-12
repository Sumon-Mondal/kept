import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { StallProvider } from "@/components/stall-provider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Kept — the take-home till",
  description:
    "A campus till that reads a sale in plain language, shows what you keep after PayPal Checkout, and holds orders that arrive as a screenshot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased">
        <StallProvider>
          <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 pb-16 sm:px-6">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </StallProvider>
      </body>
    </html>
  );
}
