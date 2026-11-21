import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PETORA Indonesia",
  description: "Aplikasi operasional klinik hewan dan pet shop terintegrasi untuk banyak cabang.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
