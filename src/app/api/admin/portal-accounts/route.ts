/**
 * POST /api/admin/portal-accounts — buat akun portal untuk customer (Owner only).
 * Body: { customerId, email, password }. Hanya Owner yang bisa akses.
 */
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { createPortalAccount } from "@/lib/auth/portal";

export async function POST(request: Request) {
  const actor = await requireActor();
  if (!actor.user.isOwner) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  let body: { customerId?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const customerId = body.customerId?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!customerId || !email || !password) {
    return NextResponse.json({ error: "customerId, email, password wajib diisi" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Kata sandi minimal 8 karakter" }, { status: 400 });
  }
  try {
    const user = await createPortalAccount(customerId, email, password);
    return NextResponse.json({ user });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    if (err.code === "23503") {
      return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
    }
    throw e;
  }
}