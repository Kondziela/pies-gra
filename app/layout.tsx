import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "PIES - Gra Karciana",
  description: "Gra karciana PIES dla 4 graczy online w czasie rzeczywistym",
  keywords: ["gra karciana", "PIES", "multiplayer", "karty", "online"],
  authors: [{ name: "PIES Game Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
