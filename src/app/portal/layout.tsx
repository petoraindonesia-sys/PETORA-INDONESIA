import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Pemilik Hewan - PETORA",
  description: "Portal untuk pemilik hewan melihat riwayat medis dan tagihan",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}