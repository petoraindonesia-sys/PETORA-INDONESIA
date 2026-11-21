/**
 * /api/reports — laporan periode (BR-016).
 * GET: ?type=sales|visits&from=ISO&to=ISO&branchId=...
 * Parameter from/to dalam ISO 8601 UTC. Hasil agregasi per hari lokal per cabang.
 */
import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { getPeriodSales, getPeriodVisits, type PeriodFilter } from "@/lib/reports/service";

function parseISO(param: string | null): Date | null {
  if (!param) return null;
  const d = new Date(param);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActor();
  } catch {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "sales";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const branchId = searchParams.get("branchId") ?? undefined;

  const fromUtc = parseISO(fromParam);
  const toUtc = parseISO(toParam);

  if (!fromUtc || !toUtc) {
    return NextResponse.json(
      { error: "Parameter from dan to wajib (ISO 8601 UTC), contoh: 2026-11-01T00:00:00Z" },
      { status: 400 },
    );
  }
  if (fromUtc >= toUtc) {
    return NextResponse.json({ error: "from harus sebelum to" }, { status: 400 });
  }

  const filter: PeriodFilter = { branchId, fromUtc, toUtc };

  try {
    if (type === "sales") {
      const data = await withActor(session.userId, (tx) => getPeriodSales(tx, filter));
      return NextResponse.json({ type: "sales", from: fromParam, to: toParam, data });
    }
    if (type === "visits") {
      const data = await withActor(session.userId, (tx) => getPeriodVisits(tx, filter));
      return NextResponse.json({ type: "visits", from: fromParam, to: toParam, data });
    }
    return NextResponse.json({ error: "type harus 'sales' atau 'visits'" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}