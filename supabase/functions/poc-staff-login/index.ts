import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return json({ error: "Invalid credentials" }, 401);
  }
  if (new TextEncoder().encode(rawBody).byteLength > 2048) {
    return json({ error: "Invalid request" }, 400);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid credentials" }, 401);
  }
  if (!payload || typeof payload !== "object") return json({ error: "Invalid credentials" }, 401);

  const { username, pin } = payload as Record<string, unknown>;
  if (
    typeof username !== "string" ||
    typeof pin !== "string" ||
    username.length < 3 ||
    username.length > 64 ||
    !/^[a-zA-Z0-9._-]+$/.test(username) ||
    !/^\d{6}$/.test(pin)
  ) return json({ error: "Invalid credentials" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !publishableKey) {
    return json({ error: "Authentication service unavailable" }, 503);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalized = username.toLowerCase();
  const source = req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { data: allowed, error: rateError } = await admin.rpc(
    "poc_consume_staff_login_attempt",
    { p_username: normalized, p_source: source },
  );
  if (rateError || allowed !== true) return json({ error: "Invalid credentials" }, 401);

  const { data: identity, error: identityError } = await admin
    .rpc("poc_lookup_staff_login_identity", { p_username: normalized })
    .maybeSingle();

  const authEmail = !identityError && identity?.is_active === true
    ? identity.auth_email
    : `disabled-${crypto.randomUUID()}@invalid.petora.local`;

  const { data, error } = await authClient.auth.signInWithPassword({
    email: authEmail,
    password: pin,
  });

  if (error || !data.session || !identity || identity.is_active !== true) {
    return json({ error: "Invalid credentials" }, 401);
  }

  await admin.rpc("poc_reset_staff_login_attempts", {
    p_username: normalized,
    p_source: source,
  });

  return json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    token_type: data.session.token_type,
    user: { id: data.user.id },
  });
});
