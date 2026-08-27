import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GradScan",
  description: "Live UK graduate role scanner, matched to your profile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
