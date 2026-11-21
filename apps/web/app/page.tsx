import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

const productAreas = [
  {
    number: "01",
    title: "Klinik hewan",
    description:
      "Mendukung alur layanan klinik dan pencatatan kebutuhan perawatan hewan.",
  },
  {
    number: "02",
    title: "Pet shop",
    description:
      "Menyatukan aktivitas toko dan pengelolaan kebutuhan produk hewan.",
  },
  {
    number: "03",
    title: "Operasional multi-cabang",
    description:
      "Menghubungkan kegiatan perusahaan dalam satu sistem dengan cakupan cabang.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="flex items-center justify-between border-b border-border pb-5" aria-label="PETORA Indonesia">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-accent text-lg font-semibold text-white shadow-sm">
            P
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-primary">PETORA</span>
            <span className="text-sm text-secondary">Indonesia</span>
          </div>
        </div>
        <Badge tone="neutral">Platform operasional</Badge>
      </header>

      <section className="grid flex-1 content-center gap-12 py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center lg:gap-20 lg:py-24">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Klinik hewan & pet shop
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-primary sm:text-5xl lg:text-6xl">
            Satu ruang kerja untuk layanan hewan yang lebih teratur.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            PETORA menyatukan operasional klinik hewan dan pet shop dalam satu
            perusahaan dengan dukungan banyak cabang.
          </p>
        </div>

        <div className="grid gap-3">
          {productAreas.map((area) => (
            <Card key={area.number} className="transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none">
              <CardHeader>
                <span className="text-xs font-semibold tabular-nums text-tertiary">{area.number}</span>
                <Badge tone="info">PETORA</Badge>
              </CardHeader>
              <CardTitle>{area.title}</CardTitle>
              <CardDescription>{area.description}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-1 border-t border-border py-5 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between">
        <span>PETORA Indonesia</span>
        <span>Sistem operasional klinik hewan dan pet shop</span>
      </footer>
    </main>
  );
}
