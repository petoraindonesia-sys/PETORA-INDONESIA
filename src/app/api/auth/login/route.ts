/**
 * POST /api/auth/login — login lokal (email + password).
 * Body: { email, password }. Sukses -> set cookie sesi HttpOnly, { user }.
 * Gagal -> 401 (pesan seragam).
 */
import { NextResponse } from "next/server";
import { login } from "@/lib/auth/service";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/service";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const result = await login(email, password);
  if (!result) {
    return NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });
  }
  const response = NextResponse.json({ user: result.user });
  response.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
