/**
 * Hewan/pasien (BR-003) — service.
 *
 * Dijalankan di dalam `withActor` (RLS aktif). Hewan terpusat lintas cabang,
 * terikat ke satu pelanggan pemilik (customer_id). Nama & species wajib diisi.
 */
import type { PoolClient } from "@/lib/db";
import { getCustomer } from "@/lib/customer/service";

export type PetSex = "male" | "female" | "unknown";

export interface Pet {
  id: string;
  customerId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex;
  birthDate: string | null;
  weightGrams: number | null;
  notes: string | null;
  createdAt: Date;
}

type PetRow = {
  id: string;
  customer_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  weight_grams: number | null;
  notes: string | null;
  created_at: Date;
};

function toSex(s: string | null): PetSex {
  if (s === "male" || s === "female") return s;
  return "unknown";
}

function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    customerId: row.customer_id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    sex: toSex(row.sex),
    birthDate: row.birth_date,
    weightGrams: row.weight_grams,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** Daftar hewan milik satu pelanggan (RLS sudah membatasi). */
export async function listPetsByCustomer(tx: PoolClient, customerId: string): Promise<Pet[]> {
  const res = await tx.query<PetRow>(
    `select id, customer_id, name, species, breed, sex, birth_date, weight_grams, notes, created_at
       from pet where customer_id = $1 order by created_at asc`,
    [customerId],
  );
  return res.rows.map(toPet);
}

/** Ambil satu hewan by id (yang terlihat oleh RLS). */
export async function getPet(tx: PoolClient, id: string): Promise<Pet | null> {
  const res = await tx.query<PetRow>(
    `select id, customer_id, name, species, breed, sex, birth_date, weight_grams, notes, created_at
       from pet where id = $1`,
    [id],
  );
  return res.rows[0] ? toPet(res.rows[0]) : null;
}

export interface CreatePetInput {
  customerId: string;
  name: string;
  species: string;
  breed?: string | null;
  sex?: PetSex;
  birthDate?: string | null;
  weightGrams?: number | null;
  notes?: string | null;
  actorId: string;
}

/** Buat hewan baru. Nama & species wajib; customer harus ada (diperiksa RLS & FK). */
export async function createPet(tx: PoolClient, input: CreatePetInput): Promise<Pet> {
  const name = input.name?.trim() ?? "";
  const species = input.species?.trim() ?? "";
  if (!name) throw new Error("Nama hewan wajib diisi");
  if (!species) throw new Error("Spesies hewan wajib diisi");
  // Pastikan pemilik terlihat oleh RLS (pelanggan terpusat — boleh dari cabang lain).
  const owner = await getCustomer(tx, input.customerId);
  if (!owner) throw new Error("Pelanggan tidak ditemukan");

  const sex = input.sex ?? "unknown";
  const res = await tx.query<PetRow>(
    `insert into pet (customer_id, name, species, breed, sex, birth_date, weight_grams, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning id, customer_id, name, species, breed, sex, birth_date, weight_grams, notes, created_at`,
    [
      input.customerId,
      name,
      species,
      input.breed?.trim() || null,
      sex,
      input.birthDate || null,
      input.weightGrams ?? null,
      input.notes?.trim() || null,
    ],
  );
  return toPet(res.rows[0]);
}

export interface UpdatePetInput {
  name?: string;
  species?: string;
  breed?: string | null;
  sex?: PetSex;
  birthDate?: string | null;
  weightGrams?: number | null;
  notes?: string | null;
}

/** Ubah hewan. Hanya field yang diberikan yang diubah. */
export async function updatePet(
  tx: PoolClient,
  id: string,
  input: UpdatePetInput,
): Promise<Pet | null> {
  const current = await getPet(tx, id);
  if (!current) return null;

  const name = input.name !== undefined ? input.name.trim() : current.name;
  const species = input.species !== undefined ? input.species.trim() : current.species;
  if (!name) throw new Error("Nama hewan wajib diisi");
  if (!species) throw new Error("Spesies hewan wajib diisi");
  const breed = input.breed !== undefined ? input.breed?.trim() || null : current.breed;
  const sex = input.sex !== undefined ? input.sex : current.sex;
  const birthDate = input.birthDate !== undefined ? input.birthDate : current.birthDate;
  const weightGrams = input.weightGrams !== undefined ? input.weightGrams : current.weightGrams;
  const notes = input.notes !== undefined ? input.notes?.trim() || null : current.notes;

  const res = await tx.query<PetRow>(
    `update pet set name = $1, species = $2, breed = $3, sex = $4, birth_date = $5,
            weight_grams = $6, notes = $7 where id = $8
       returning id, customer_id, name, species, breed, sex, birth_date, weight_grams, notes, created_at`,
    [name, species, breed, sex, birthDate, weightGrams, notes, id],
  );
  return res.rows[0] ? toPet(res.rows[0]) : null;
}
