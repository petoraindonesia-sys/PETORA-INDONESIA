/**
 * Service vaksinasi (BR-013).
 *
 * Mencatat vaksin yang diberikan + menghitung jadwal booster.
 * Interval default per jenis vaksin (dari product.vaccine_interval_days),
 * dokter bisa override per kasus via interval_days.
 */
import { withActor } from "@/lib/db";
import type { PoolClient } from "pg";

export interface Vaccination {
  id: string;
  petId: string;
  visitId: string | null;
  productId: string;
  batchId: string | null;
  name: string;
  manufacturer: string | null;
  administeredAt: Date | null;
  nextDueAt: Date | null;
  intervalDays: number | null;
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
  administeredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaccinationInput {
  petId: string;
  visitId?: string | null;
  productId: string;
  batchId?: string | null;
  administeredAt?: Date | string | null;
  intervalDays?: number | null;
  notes?: string | null;
  status?: "scheduled" | "completed" | "cancelled";
}

export interface VaccinationWithPet extends Vaccination {
  petName: string;
  species: string;
  ownerName: string;
}

/** Default interval vaksin (hari) — bisa dipindah ke product nanti. */
const DEFAULT_VACCINE_INTERVALS: Record<string, number> = {
  "rabies": 365,
  "dhppi": 365,
  "lepto": 365,
  "bordetella": 180,
  "fvrcp": 365,
  "felv": 365,
  "chlamydia": 365,
};

/** Hitung next_due_at dari administered_at + interval_days. */
export function calculateNextDue(administeredAt: Date, intervalDays: number): Date {
  const due = new Date(administeredAt);
  due.setDate(due.getDate() + intervalDays);
  return due;
}

/** Dapatkan interval default dari nama vaksin (case-insensitive). */
export function getDefaultInterval(vaccineName: string): number {
  const key = vaccineName.toLowerCase().replace(/[^a-z]/g, "");
  return DEFAULT_VACCINE_INTERVALS[key] ?? 365;
}

/** Buat record vaksinasi (scheduled atau completed). */
export async function createVaccination(
  actorId: string,
  input: VaccinationInput,
): Promise<Vaccination> {
  return withActor(actorId, async (tx: PoolClient) => {
    // Ambil info produk untuk nama & interval default
    const productRows = await tx.query(
      `select name, coalesce(vaccine_interval_days, 0) as interval_days from product where id = $1`,
      [input.productId],
    );
    const product = productRows.rows[0];
    if (!product) throw new Error("Produk tidak ditemukan");

    const name = product.name;
    const defaultInterval = product.interval_days || getDefaultInterval(name);
    const intervalDays = input.intervalDays ?? defaultInterval;

    let administeredAt: Date | null = null;
    if (input.administeredAt) {
      administeredAt = input.administeredAt instanceof Date ? input.administeredAt : new Date(input.administeredAt);
    }

    const nextDueAt = administeredAt ? calculateNextDue(administeredAt, intervalDays) : null;
    const status = input.status ?? (administeredAt ? "completed" : "scheduled");

    const rows = await tx.query(
      `insert into vaccination (pet_id, visit_id, product_id, batch_id, name, manufacturer,
                                administered_at, next_due_at, interval_days, status, notes, administered_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning id, pet_id, visit_id, product_id, batch_id, name, manufacturer,
                 administered_at, next_due_at, interval_days, status, notes,
                 administered_by, created_at, updated_at`,
      [
        input.petId,
        input.visitId ?? null,
        input.productId,
        input.batchId ?? null,
        name,
        null, // manufacturer - bisa diambil dari product nanti
        administeredAt,
        nextDueAt,
        intervalDays,
        status,
        input.notes ?? null,
        actorId,
      ],
    );
    return mapRow(rows.rows[0]);
  });
}

/** Update vaksinasi (mis. tandai completed, update notes, ganti interval). */
export async function updateVaccination(
  actorId: string,
  vaccinationId: string,
  updates: Partial<Pick<VaccinationInput, "administeredAt" | "intervalDays" | "notes" | "status">>,
): Promise<Vaccination> {
  return withActor(actorId, async (tx: PoolClient) => {
    // Ambil record existing
    const existingRows = await tx.query(
      `select * from vaccination where id = $1`,
      [vaccinationId],
    );
    const existing = existingRows.rows[0];
    if (!existing) throw new Error("Vaksinasi tidak ditemukan");

    const administeredAt = updates.administeredAt
      ? (updates.administeredAt instanceof Date ? updates.administeredAt : new Date(updates.administeredAt))
      : existing.administered_at;

    const intervalDays = updates.intervalDays ?? existing.interval_days;
    const status = updates.status ?? existing.status;

    const nextDueAt = administeredAt ? calculateNextDue(administeredAt, intervalDays) : null;

    const rows = await tx.query(
      `update vaccination
          set administered_at = $1,
              next_due_at = $2,
              interval_days = $3,
              status = $4,
              notes = coalesce($5, notes),
              updated_at = now()
        where id = $6
        returning id, pet_id, visit_id, product_id, batch_id, name, manufacturer,
                  administered_at, next_due_at, interval_days, status, notes,
                  administered_by, created_at, updated_at`,
      [administeredAt, nextDueAt, intervalDays, status, updates.notes ?? null, vaccinationId],
    );
    return mapRow(rows.rows[0]);
  });
}

/** Batalkan vaksinasi (status = cancelled). */
export async function cancelVaccination(actorId: string, vaccinationId: string): Promise<void> {
  return withActor(actorId, async (tx: PoolClient) => {
    await tx.query(`update vaccination set status = 'cancelled', updated_at = now() where id = $1`, [
      vaccinationId,
    ]);
  });
}

/** Dapatkan vaksinasi by ID. */
export async function getVaccination(actorId: string, vaccinationId: string): Promise<Vaccination | null> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(`select * from vaccination where id = $1`, [vaccinationId]);
    return rows.rows[0] ? mapRow(rows.rows[0]) : null;
  });
}

/** Daftar vaksinasi hewan (terurut administered_at desc). */
export async function listVaccinationsByPet(actorId: string, petId: string): Promise<Vaccination[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    const rows = await tx.query(
      `select * from vaccination where pet_id = $1 order by administered_at desc nulls last, created_at desc`,
      [petId],
    );
    return rows.rows.map(mapRow);
  });
}

/** Daftar vaksinasi yang jatuh tempo (next_due_at <= now, status scheduled). */
export async function listDueVaccinations(actorId: string, branchId?: string): Promise<VaccinationWithPet[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    let sql = `
      select v.*, p.name as pet_name, p.species, c.name as owner_name
      from vaccination v
      join pet p on p.id = v.pet_id
      join customer c on c.id = p.customer_id
      where v.status = 'scheduled'
        and v.next_due_at is not null
        and v.next_due_at <= now()
    `;
    const params: unknown[] = [];

    if (branchId) {
      sql += ` and exists (
        select 1 from visit vis where vis.id = v.visit_id and vis.branch_id = $1
      )`;
      params.push(branchId);
    }

    sql += ` order by v.next_due_at asc`;

    const rows = await tx.query(sql, params);
    return rows.rows.map(mapRowWithPet);
  });
}

/** Daftar vaksinasi yang akan datang (next_due_at dalam 30 hari, status scheduled). */
export async function listUpcomingVaccinations(actorId: string, branchId?: string): Promise<VaccinationWithPet[]> {
  return withActor(actorId, async (tx: PoolClient) => {
    let sql = `
      select v.*, p.name as pet_name, p.species, c.name as owner_name
      from vaccination v
      join pet p on p.id = v.pet_id
      join customer c on c.id = p.customer_id
      where v.status = 'scheduled'
        and v.next_due_at is not null
        and v.next_due_at > now()
        and v.next_due_at <= now() + interval '30 days'
    `;
    const params: unknown[] = [];

    if (branchId) {
      sql += ` and exists (
        select 1 from visit vis where vis.id = v.visit_id and vis.branch_id = $1
      )`;
      params.push(branchId);
    }

    sql += ` order by v.next_due_at asc`;

    const rows = await tx.query(sql, params);
    return rows.rows.map(mapRowWithPet);
  });
}

function mapRow(row: Record<string, unknown>): Vaccination {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    visitId: row.visit_id as string | null,
    productId: row.product_id as string,
    batchId: row.batch_id as string | null,
    name: row.name as string,
    manufacturer: row.manufacturer as string | null,
    administeredAt: row.administered_at ? new Date(row.administered_at as string) : null,
    nextDueAt: row.next_due_at ? new Date(row.next_due_at as string) : null,
    intervalDays: row.interval_days as number | null,
    status: row.status as "scheduled" | "completed" | "cancelled",
    notes: row.notes as string | null,
    administeredBy: row.administered_by as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRowWithPet(row: Record<string, unknown>): VaccinationWithPet {
  return {
    ...mapRow(row),
    petName: row.pet_name as string,
    species: row.species as string,
    ownerName: row.owner_name as string,
  };
}