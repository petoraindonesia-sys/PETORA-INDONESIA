/**
 * Konstanta bersama auth yang aman di-import di Edge runtime (middleware) maupun
 * Node runtime. Tidak boleh mengandung import `node:crypto` (middleware = Edge).
 */

export const SESSION_COOKIE = "petora_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari
