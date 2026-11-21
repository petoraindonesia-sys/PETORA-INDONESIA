/**
 * Halaman /app — area operasional (terproteksi). Sementara: menampilkan pengguna
 * yang login. Route otomatis redirect ke /login bila tidak ada sesi valid
 * (lihat src/middleware.ts).
 */
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AppHome() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Selamat datang, {session.user.fullName}.</h1>
      <p className="mt-2 text-sm opacity-60">
        {session.user.isOwner ? "Peran: Owner" : "Peran: Staff/Operasional"}
      </p>
      <nav className="mt-6 flex gap-2">
        <a
          href="/app/cashier"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Kasir
        </a>
        <a
          href="/app/customers"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Pelanggan
        </a>
        {session.user.isOwner ? (
          <a
            href="/app/branches"
            className="rounded-xl border px-4 py-2 text-sm"
            style={{ borderColor: "rgba(0,0,0,0.12)" }}
          >
            Cabang
          </a>
        ) : null}
      </nav>
      <form action="/api/auth/logout" method="post" className="mt-8">
        <button
          type="submit"
          className="rounded-xl border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Keluar
        </button>
      </form>
    </main>
  );
}
