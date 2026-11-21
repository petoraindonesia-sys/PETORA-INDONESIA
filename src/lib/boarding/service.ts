/**
 * Service Boarding / Rawat Inap (BR-012, BR-014).
 *
 * Check-in/check-out hewan, biaya kandang per 24 jam (minimal 1 hari).
 * BR-012: check-in dan check-out pada timestamp yang sama = 1 hari.
 */
import { withActor } from "@/lib/db";
import type { PoolClient } from "pg";
import { roundHalfUp } from "@/lib/domain/money";

type Money = number;

export interface Boarding {
  id: string;
  petId: string;
  visitId: string | null;
  cageId: string | null;
  branchId: string;
  checkedInAt: Date;
  checkedOutAt: Date | null;
  cageRatePerDay: Money;
  notes: string | null;
  status: "checked_in" | "checked_out" | "cancelled";
  checkedInBy: string | null;
  checkedOutBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Computed
  totalDays: number;
  totalCageFee: Money;
}

export interface Cage {
  id: string;
  branchId: string;
  code: string;
  name: string | null;
  size: string | null;
  ratePerDay: Money;
  isActive: boolean;
}

export interface BoardingInput {
  petId: string;
  visitId?: string | null;
  cageId?: string | null;
  branchId: string;
  cageRatePerDay?: Money; // override, default dari cage
  notes?: string | null;
}

export interface BoardingWithPet extends Boarding {
  petName: string;
  species: string;
  ownerName: string;
  cageCode: string | null;
}

/** Hitung total hari (BR-012: min 1 hari, per 24 jam). */
export function calculateBoardingDays(checkedInAt: Date, checkedOutAt: Date | null): number {
  const end = checkedOutAt ?? new Date();
  const diffMs = end.getTime() - checkedInAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.ceil(diffDays));
}

/** Hitung total biaya kandang. */
export function calculateCageFee(days: number, ratePerDay: Money): Money {
  return roundHalfUp(days * ratePerDay);
}

/** Check-in hewan (buat record boarding baru). */
export async function checkInBoarding(
  actorId: string,
  input: BoardingInput,
): Promise<Boarding> {
  return withActor(actorId, async (tx: PoolClient) => {
    // Ambil tarif kandang default dari cage jika ada
    let cageRatePerDay = input.cageRatePerDay;
    const cageId = input.cageId;

    if (cageId) {
      const cageRes = await tx.query<{ rate_per_day: string }>(
        `select rate_per_day from cage where id = $1 and is_active = true`,
        [cageId],
      );
      if (cageRes.rows[0]) {
        cageRatePerDay = Number(cageRes.rows[0].rate_per_day);
      }
    }

    if (!cageRatePerDay || cageRatePerDay <= 0) {
      throw new Error("Tarif kandang harus > 0 (pilih kandang aktif atau isi override)");
    }

    const checkedInAt = new Date();
    const rows = await tx.query(
      `insert into boarding (pet_id, visit_id, cage_id, branch_id, checked_in_at, cage_rate_per_day, notes, checked_in_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       returning id, pet_id, visit_id, cage_id, branch_id, checked_in_at, checked_out_at,
                cage_rate_per_day, notes, status, checked_in_by, checked_out_by, created_at, updated_at`,
      [
        input.petId,
        input.visitId ?? null,
        cageId ?? null,
        input.branchId,
        checkedInAt,
        cageRatePerDay,
        input.notes ?? null,
        actorId,
      ],
    );
    return mapRowWithComputed(rows.rows[0]);
  });
}

/** Check-out hewan (update checked_out_at, hitung biaya). */
export async function checkOutBoarding(
  actorId: string,
  boardingId: string,
): Promise<Boarding> {
  return withActor(actorId, async (tx: PoolClient) => {
    const checkedOutAt = new Date();
    const rows = await tx.query(
      `update boarding
          set checked_out_at = $1,
              checked_out_by = $2,
              status = 'checked_out',
              updated_at = now()
        where id = $3
        returning id, pet_id, visit_id, cage_id, branch_id, checked_in_at, checked_out_at,
                  cage_rate_per_day, notes, status, checked_in_by, checked_out_by, created_at, updated_at`,
      [checkedOutAt, actorId, boardingId],
    );
    if (rows.rows.length === 0) throw new Error("Boarding tidak ditemukan");
    return mapRowWithComputed(rows.rows[0]);
  });
}

/** Batalkan boarding (status = cancelled). */
export async function cancelBoarding(actorId: string, boardingId: string): Promise<void> {
  return withActor(actorId, async (tx: PoolClient) => {
    await tx.query(
      `update boarding set status = 'cancelled', updated_at = now() where id = $1`,
      [boardingId],
    );
  });
}

/** Dapatkan boarding by ID. */
export async function getBoarding(actorId: string, boardingId: string): Promise<Boarding | null> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(
      `select * from boarding where id = $1`,
      [boardingId],
    );
    return rows.rows[0] ? mapRowWithComputed(rows.rows[0]) : null;
  });
}

/** Daftar boarding per hewan. */
export async function listBoardingByPet(actorId: string, petId: string): Promise<Boarding[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(
      `select * from boarding where pet_id = $1 order by checked_in_at desc`,
      [petId],
    );
    return rows.rows.map(mapRowWithComputed);
  });
}

/** Daftar boarding aktif (checked_in) di cabang. */
export async function listActiveBoarding(actorId: string, branchId?: string): Promise<BoardingWithPet[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    let sql = `
      select b.*, p.name as pet_name, p.species, c.name as owner_name,
             cg.code as cage_code
      from boarding b
      join pet p on p.id = b.pet_id
      join customer c on c.id = p.customer_id
      left join cage cg on cg.id = b.cage_id
      where b.status = 'checked_in'
    `;
    const params: unknown[] = [];

    if (branchId) {
      sql += ` and b.branch_id = $1`;
      params.push(branchId);
    }

    sql += ` order by b.checked_in_at asc`;

    const rows = await tx.query(sql, params);
    return rows.rows.map(mapRowWithPet);
  });
}

/** Daftar kandang per cabang. */
export async function listCages(actorId: string, branchId: string): Promise<Cage[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(
      `select id, branch_id, code, name, size, rate_per_day, is_active, created_at, updated_at
         from cage
        where branch_id = $1 and is_active = true
        order by code`,
      [branchId],
    );
    return rows.rows.map(mapCage);
  });
}

/** Buat/update kandang (Owner/Supervisor). */
export async function upsertCage(
  actorId: string,
  input: { branchId: string; code: string; name?: string | null; size?: string | null; ratePerDay: Money; isActive?: boolean },
): Promise<Cage> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(
      `insert into cage (branch_id, code, name, size, rate_per_day, is_active)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (branch_id, code) do update set
         name = excluded.name,
         size = excluded.size,
         rate_per_day = excluded.rate_per_day,
         is_active = excluded.is_active,
         updated_at = now()
       returning id, branch_id, code, name, size, rate_per_day, is_active, created_at, updated_at`,
      [input.branchId, input.code, input.name ?? null, input.size ?? null, input.ratePerDay, input.isActive ?? true],
    );
    return mapCage(rows.rows[0]);
  });
}

function mapRow(row: Record<string, unknown>): Boarding {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    visitId: row.visit_id as string | null,
    cageId: row.cage_id as string | null,
    branchId: row.branch_id as string,
    checkedInAt: new Date(row.checked_in_at as string),
    checkedOutAt: row.checked_out_at ? new Date(row.checked_out_at as string) : null,
    cageRatePerDay: row.cage_rate_per_day as Money,
    notes: row.notes as string | null,
    status: row.status as "checked_in" | "checked_out" | "cancelled",
    checkedInBy: row.checked_in_by as string | null,
    checkedOutBy: row.checked_out_by as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    totalDays: 0,
    totalCageFee: 0,
  };
}

function mapRowWithComputed(row: Record<string, unknown>): Boarding {
  const base = mapRow(row);
  const totalDays = calculateBoardingDays(base.checkedInAt, base.checkedOutAt);
  const totalCageFee = calculateCageFee(totalDays, base.cageRatePerDay);
  return { ...base, totalDays, totalCageFee };
}

function mapRowWithPet(row: Record<string, unknown>): BoardingWithPet {
  const base = mapRowWithComputed(row);
  return {
    ...base,
    petName: row.pet_name as string,
    species: row.species as string,
    ownerName: row.owner_name as string,
    cageCode: row.cage_code as string | null,
  };
}

function mapCage(row: Record<string, unknown>): Cage {
  return {
    id: row.id as string,
    branchId: row.branch_id as string,
    code: row.code as string,
    name: row.name as string | null,
    size: row.size as string | null,
    ratePerDay: row.rate_per_day as Money,
    isActive: row.is_active as boolean,
  };
}