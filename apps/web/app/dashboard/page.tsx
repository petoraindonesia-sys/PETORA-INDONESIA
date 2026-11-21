import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Area kerja PETORA Indonesia.",
};

const workspaces = [
  {
    id: "clinic",
    number: "01",
    title: "Klinik hewan",
    description: "Alur layanan klinik untuk mendukung perawatan dan rekam medis hewan.",
    capabilities: ["Janji temu dan antrean", "Pemeriksaan dan rekam medis", "Resep dan tindakan"],
  },
  {
    id: "petshop",
    number: "02",
    title: "Pet shop",
    description: "Aktivitas toko dan pengelolaan produk dalam satu alur operasional.",
    capabilities: ["Katalog dan persediaan", "Penjualan dan pembayaran", "Pengadaan barang"],
  },
  {
    id: "organization",
    number: "03",
    title: "Organisasi",
    description: "Struktur perusahaan untuk mengelola operasional dengan banyak cabang.",
    capabilities: ["Cabang dan unit kerja", "Karyawan dan penugasan", "Peran dan kewenangan"],
  },
];

export default function DashboardPage() {
  return (
    <AppShell title="Workspace">
      <section id="overview" aria-labelledby="workspace-title" className="scroll-mt-24">
        <div className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">PETORA WORKSPACE</p>
            <h1 id="workspace-title" className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              Area kerja PETORA
            </h1>
            <p className="mt-3 text-sm leading-6 text-secondary sm:text-base">
              Satu workspace untuk operasional klinik hewan, pet shop, dan organisasi multi-cabang.
            </p>
          </div>
          <Badge tone="neutral">Fondasi workspace</Badge>
        </div>
      </section>

      <section aria-labelledby="areas-title" className="mt-8">
        <div className="mb-4">
          <h2 id="areas-title" className="text-lg font-semibold tracking-tight text-primary">Area operasional</h2>
          <p className="mt-1 text-sm text-secondary">Struktur area kerja utama PETORA.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} id={workspace.id} className="scroll-mt-28">
              <CardHeader>
                <span className="text-xs font-semibold tabular-nums text-tertiary">{workspace.number}</span>
                <Badge tone="info">Area kerja</Badge>
              </CardHeader>
              <CardTitle>{workspace.title}</CardTitle>
              <CardDescription>{workspace.description}</CardDescription>
              <ul className="mt-5 grid gap-2 border-t border-border pt-4">
                {workspace.capabilities.map((capability) => (
                  <li key={capability} className="flex items-start gap-2 text-sm text-secondary">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {capability}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Informasi workspace" className="mt-8">
        <div className="rounded-2xl border border-border bg-surface-muted px-5 py-4 sm:px-6">
          <p className="text-sm font-medium text-primary">Fondasi antarmuka</p>
          <p className="mt-1 text-sm leading-6 text-secondary">
            Halaman ini menyiapkan struktur navigasi dan tampilan workspace. Data operasional, sesi pengguna, dan hak akses akan ditampilkan setelah layanan Supabase serta autentikasi terintegrasi.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
