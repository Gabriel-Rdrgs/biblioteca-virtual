/**
 * Class-wide access gate.
 *
 * One shared password (ATLAS_SENHA_TURMA) unlocks the whole library. A
 * successful login sets an HMAC-signed cookie; every request — pages and
 * PDFs alike — is checked against it in middleware. Web Crypto is used
 * rather than node:crypto so the same code runs on the edge runtime.
 *
 * While the password is unset the gate is open and the UI says so, which
 * keeps `npm run dev` frictionless without letting a deploy be silently
 * public.
 */

export const SESSION_COOKIE = "atlas_sessao";
const SESSION_DAYS = 30;

export function gateConfigured(): boolean {
  return Boolean(process.env.ATLAS_SENHA_TURMA);
}

function secret(): string {
  return process.env.ATLAS_COOKIE_SECRET || process.env.ATLAS_SENHA_TURMA || "";
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

/** Constant-time comparison, so a wrong password fails in the same time as a right one. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ATLAS_SENHA_TURMA ?? "";
  return (
    expected.length > 0 && timingSafeEqual(candidate.normalize("NFC"), expected.normalize("NFC"))
  );
}

/** Token = expiry timestamp + signature over it. */
export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expires);
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!/^\d+$/.test(payload) || Number(payload) < Date.now()) return false;
  return timingSafeEqual(signature, await hmac(payload));
}

/**
 * The Secure flag follows the request's own protocol, not NODE_ENV: a
 * production build served over plain http (a LAN machine, a first deploy
 * without TLS) would otherwise have its cookie dropped by the browser and
 * loop back to the login page forever.
 */
export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

/** True when the request arrived over TLS, directly or via a proxy. */
export function requestIsHttps(request: { nextUrl: URL; headers: Headers }): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return request.nextUrl.protocol === "https:";
}
