import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Accounting Suite",
  description: "AI-powered, self-hosted practice management for accounting, audit, tax, VAT and legal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
