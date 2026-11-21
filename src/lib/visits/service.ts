/**
 * Kunjungan klinik (BR-001) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif). Kunjungan bersifat operasional &
 * terisolasi per cabang (visit_read/write memakai user_branch_ids()). Pemilik
 * membuat kunjungan hanya di cabang yang ditugaskan; Owner melihat semua cabang.
 */
import type { PoolClient } from "@/lib/db";
import { getCustomer } from "@/lib/customer/service";
import { getPet } from "@/lib/pet/service";

export type VisitStatus = "terdaftar" | "menunggu" | "diperiksa" | "selesai" | "dibatalkan";

export interface Visit {
  id: string;
  branchId: string;
  customerId: string;
  petId: string;
  status: VisitStatus;
  queueNumber: number | null;
  registeredBy: string | null;
  createdAt: Date;
  petName: string;
  customerName: string;
}

type VisitRow = {
  id: string;
  branch_id: string;
  customer_id: string;
  pet_id: string;
  status: string;
  queue_number: number | null;
  registered_by: string | null;
  created_at: Date;
  pet_name: string;
  customer_name: string;
};

function toVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    branchId: row.branch_id,
    customerId: row.customer_id,
    petId: row.pet_id,
    status: row.status as VisitStatus,
    queueNumber: row.queue_number,
    registeredBy: row.registered_by,
    createdAt: row.created_at,
    petName: row.pet_name,
    customerName: row.customer_name,
  };
}

/** Daftar kunjungan di satu cabang (RLS sudah membatasi). Terbaru dulu. */
export async function listVisits(
  tx: PoolClient,
  opts: { branchId: string; limit?: number },
): Promise<Visit[]> {
  const params: unknown[] = [opts.branchId];
  let limitSql = "";
  if (opts.limit) {
    params.push(opts.limit);
    limitSql = `limit $2`;
  }
  const res = await tx.query<VisitRow>(
    `select v.id, v.branch_id, v.customer_id, v.pet_id, v.status, v.queue_number,
            v.registered_by, v.created_at, p.name as pet_name, c.full_name as customer_name
       from visit v
       join pet p on p.id = v.pet_id
       join customer c on c.id = v.customer_id
      where v.branch_id = $1
      order by v.created_at desc ${limitSql}`,
    params,
  );
  return res.rows.map(toVisit);
}

/** Ambil satu kunjungan by id (yang terlihat oleh RLS). */
export async function getVisit(tx: PoolClient, id: string): Promise<Visit | null> {
  const res = await tx.query<VisitRow>(
    `select v.id, v.branch_id, v.customer_id, v.pet_id, v.status, v.queue_number,
            v.registered_by, v.created_at, p.name as pet_name, c.full_name as customer_name
       from visit v
       join pet p on p.id = v.pet_id
       join customer c on c.id = v.customer_id
      where v.id = $1`,
    [id],
  );
  return res.rows[0] ? toVisit(res.rows[0]) : null;
}

export interface CreateVisitInput {
  branchId: string;
  customerId: string;
  petId: string;
  actorId: string;
}

/** Buat kunjungan baru (status 'terdaftar', nomor antrean otomatis per hari). */
export async function createVisit(tx: PoolClient, input: CreateVisitInput): Promise<Visit> {
  const customer = await getCustomer(tx, input.customerId);
  if (!customer) throw new Error("Pelanggan tidak ditemukan");
  const pet = await getPet(tx, input.petId);
  if (!pet) throw new Error("Hewan tidak ditemukan");
  if (pet.customerId !== input.customerId) {
    throw new Error("Hewan bukan milik pelanggan yang dipilih");
  }
  // Nomor antrean: maksimum hari ini di cabang + 1.
  const qRes = await tx.query<{ next: string }>(
    `select coalesce(max(queue_number), 0) + 1 as next from visit
      where branch_id = $1 and created_at::date = (now() at time zone 'Asia/Jakarta')::date`,
    [input.branchId],
  );
  const queueNumber = Number(qRes.rows[0].next);
  const res = await tx.query<{ id: string }>(
    `insert into visit (branch_id, customer_id, pet_id, status, queue_number, registered_by)
     values ($1,$2,$3,'terdaftar',$4,$5)
     returning id`,
    [input.branchId, input.customerId, input.petId, queueNumber, input.actorId],
  );
  const saved = await getVisit(tx, res.rows[0].id);
  if (!saved) throw new Error("Gagal memuat kunjungan setelah dibuat");
  return saved;
}

const ALLOWED_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  terdaftar: ["menunggu", "dibatalkan"],
  menunggu: ["diperiksa", "dibatalkan"],
  diperiksa: ["selesai", "dibatalkan"],
  selesai: [],
  dibatalkan: [],
};

export type UpdateVisitStatusInput = { status: VisitStatus };

/** Ubah status kunjungan dengan transisi yang diizinkan (BR-001 alur klinik). */
export async function updateVisitStatus(
  tx: PoolClient,
  id: string,
  input: UpdateVisitStatusInput,
): Promise<Visit | null> {
  const current = await getVisit(tx, id);
  if (!current) return null;
  const allowed = ALLOWED_TRANSITIONS[current.status];
  if (!allowed.includes(input.status)) {
    throw new Error(`Transisi status tidak diizinkan: ${current.status} → ${input.status}`);
  }
  const res = await tx.query<{ id: string }>(
    `update visit set status = $1 where id = $2 returning id`,
    [input.status, id],
  );
  return res.rows[0] ? getVisit(tx, id) : null;
}
