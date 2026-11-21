import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PETORA Indonesia",
    template: "%s | PETORA Indonesia",
  },
  description:
    "Platform operasional klinik hewan dan pet shop untuk satu perusahaan dengan banyak cabang.",
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
