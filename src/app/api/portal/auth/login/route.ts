/**
 * POST /api/portal/auth/login — login portal (email + password).
 * Body: { email, password }. Sukses -> set cookie portal HttpOnly, { user }.
 * Gagal -> 401 (pesan seragam).
 */
import { NextResponse } from "next/server";
import { loginPortal } from "@/lib/auth/portal";
import { PORTAL_SESSION_COOKIE, PORTAL_SESSION_TTL_SECONDS } from "@/lib/auth/portal";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const result = await loginPortal(email, password);
  if (!result) {
    return NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });
  }
  const response = NextResponse.json({ user: result.user });
  response.cookies.set(PORTAL_SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PORTAL_SESSION_TTL_SECONDS,
  });
  return response;
}