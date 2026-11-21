/**
 * Rekam medis (BR-003/BR-004/BR-005) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif):
 * - Baca lintas cabang bila aktor punya permission 'medical.read' (BR-003).
 * - Tulis (insert) hanya Dokter (permission 'medical.write'), status 'draft',
 *   author = aktor, dan cabang tempat pelayanan termasuk cabang aktor (BR-004).
 * - Update hanya pada draft milik sendiri; final terkunci oleh RLS (BR-004).
 * - Finalisasi: set status='final' + finalized_at; hanya boleh dari draft.
 *
 * Catatan: RLS tidak menyediakan finalisasi eksplisit — finalisasi dilakukan di
 * dalam withActor dengan UPDATE (RLS medical_update: using draft milik sendiri).
 */
import type { PoolClient } from "@/lib/db";

export type MedicalStatus = "draft" | "final";

export interface MedicalRecord {
  id: string;
  visitId: string | null;
  branchId: string;
  petId: string;
  authorId: string;
  status: MedicalStatus;
  shared: boolean;
  anamnesis: string | null;
  examination: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  createdAt: Date;
  finalizedAt: Date | null;
}

type MedicalRow = {
  id: string;
  visit_id: string | null;
  branch_id: string;
  pet_id: string;
  author_id: string;
  status: string;
  shared: boolean;
  anamnesis: string | null;
  examination: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  created_at: Date;
  finalized_at: Date | null;
};

function toMedical(row: MedicalRow): MedicalRecord {
  return {
    id: row.id,
    visitId: row.visit_id,
    branchId: row.branch_id,
    petId: row.pet_id,
    authorId: row.author_id,
    status: row.status as MedicalStatus,
    shared: row.shared,
    anamnesis: row.anamnesis,
    examination: row.examination,
    diagnosis: row.diagnosis,
    treatment: row.treatment,
    prescription: row.prescription,
    createdAt: row.created_at,
    finalizedAt: row.finalized_at,
  };
}

/** Daftar rekam medis milik satu hewan (terlihat oleh RLS — lintas cabang). */
export async function listMedicalRecordsByPet(
  tx: PoolClient,
  petId: string,
): Promise<MedicalRecord[]> {
  const res = await tx.query<MedicalRow>(
    `select id, visit_id, branch_id, pet_id, author_id, status, shared,
            anamnesis, examination, diagnosis, treatment, prescription, created_at, finalized_at
       from medical_record where pet_id = $1 order by created_at desc`,
    [petId],
  );
  return res.rows.map(toMedical);
}

/** Ambil satu rekam medis by id (yang terlihat oleh RLS). */
export async function getMedicalRecord(tx: PoolClient, id: string): Promise<MedicalRecord | null> {
  const res = await tx.query<MedicalRow>(
    `select id, visit_id, branch_id, pet_id, author_id, status, shared,
            anamnesis, examination, diagnosis, treatment, prescription, created_at, finalized_at
       from medical_record where id = $1`,
    [id],
  );
  return res.rows[0] ? toMedical(res.rows[0]) : null;
}

export interface CreateMedicalInput {
  branchId: string;
  petId: string;
  visitId?: string | null;
  actorId: string;
  anamnesis?: string | null;
  examination?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  prescription?: string | null;
}

/**
 * Buat entri rekam medis baru sebagai draft (BR-004).
 * RLS medical_insert menuntut: medical.write, author = aktor, status draft,
 * dan cabang termasuk cabang aktor. Pelanggaran akan melempar error dari DB.
 */
export async function createMedicalDraft(
  tx: PoolClient,
  input: CreateMedicalInput,
): Promise<MedicalRecord> {
  const res = await tx.query<Parameters<typeof toMedical>[0]>(
    `insert into medical_record (
       branch_id, pet_id, visit_id, author_id, status, shared,
       anamnesis, examination, diagnosis, treatment, prescription
     ) values ($1,$2,$3,$4,'draft',false,$5,$6,$7,$8,$9)
     returning id, visit_id, branch_id, pet_id, author_id, status, shared,
               anamnesis, examination, diagnosis, treatment, prescription, created_at, finalized_at`,
    [
      input.branchId,
      input.petId,
      input.visitId ?? null,
      input.actorId,
      input.anamnesis?.trim() || null,
      input.examination?.trim() || null,
      input.diagnosis?.trim() || null,
      input.treatment?.trim() || null,
      input.prescription?.trim() || null,
    ],
  );
  return toMedical(res.rows[0]);
}

export interface UpdateMedicalDraftInput {
  anamnesis?: string | null;
  examination?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  prescription?: string | null;
}

/**
 * Ubah entri draft (BR-004). Hanya draft milik sendiri yang dapat diubah
 * (RLS medical_update USING). Entri final → 0 baris → dikembalikan null.
 */
export async function updateMedicalDraft(
  tx: PoolClient,
  id: string,
  input: UpdateMedicalDraftInput,
): Promise<MedicalRecord | null> {
  const res = await tx.query<Parameters<typeof toMedical>[0]>(
    `update medical_record
        set anamnesis = coalesce($2, anamnesis),
            examination = coalesce($3, examination),
            diagnosis = coalesce($4, diagnosis),
            treatment = coalesce($5, treatment),
            prescription = coalesce($6, prescription)
      where id = $1
      returning id, visit_id, branch_id, pet_id, author_id, status, shared,
                anamnesis, examination, diagnosis, treatment, prescription, created_at, finalized_at`,
    [
      id,
      input.anamnesis !== undefined ? input.anamnesis?.trim() || null : undefined,
      input.examination !== undefined ? input.examination?.trim() || null : undefined,
      input.diagnosis !== undefined ? input.diagnosis?.trim() || null : undefined,
      input.treatment !== undefined ? input.treatment?.trim() || null : undefined,
      input.prescription !== undefined ? input.prescription?.trim() || null : undefined,
    ],
  );
  return res.rows[0] ? toMedical(res.rows[0]) : null;
}

/**
 * Finalisasi entri (BR-004): draft → final. Dilakukan di dalam withActor;
 * RLS medical_update (USING draft milik sendiri) membatasi. Entri yang sudah
 * final tidak dapat difinalisasi lagi (0 baris) — kembalikan null.
 */
export async function finalizeMedical(tx: PoolClient, id: string): Promise<MedicalRecord | null> {
  const current = await getMedicalRecord(tx, id);
  if (!current) return null;
  if (current.status !== "draft") {
    throw new Error(`Entri sudah ${current.status} dan tidak dapat difinalisasi`);
  }
  const res = await tx.query<Parameters<typeof toMedical>[0]>(
    `update medical_record set status = 'final', finalized_at = now()
      where id = $1
      returning id, visit_id, branch_id, pet_id, author_id, status, shared,
                anamnesis, examination, diagnosis, treatment, prescription, created_at, finalized_at`,
    [id],
  );
  return res.rows[0] ? toMedical(res.rows[0]) : null;
}
