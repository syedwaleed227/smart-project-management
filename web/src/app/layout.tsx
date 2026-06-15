import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPMS — Smart Project Management",
  description:
    "Projects, finance, meetings, approvals and reporting for the whole company.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
