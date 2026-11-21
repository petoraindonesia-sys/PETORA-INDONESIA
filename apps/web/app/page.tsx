export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
      <header className="flex items-center gap-3" aria-label="PETORA Indonesia">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-xl bg-accent text-lg font-semibold text-white"
        >
          P
        </span>
        <span className="text-base font-semibold tracking-tight text-primary">
          PETORA
        </span>
        <span className="text-sm text-secondary">Indonesia</span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-24">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Klinik hewan & pet shop
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Satu ruang kerja untuk layanan hewan yang lebih teratur.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
          PETORA menyatukan operasional klinik hewan dan pet shop dalam satu
          perusahaan dengan dukungan banyak cabang.
        </p>
      </section>

      <footer className="border-t border-border py-5 text-sm text-secondary">
        PETORA Indonesia
      </footer>
    </main>
  );
}
