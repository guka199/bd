// Signed access token stored in an httpOnly cookie once the right PIN is entered.
// Used by both the proxy (src/proxy.ts) and server components, so it only relies
// on Web Crypto and has no Next.js imports.

export const ACCESS_COOKIE = "eve_access";
export const ACCESS_TTL_SECONDS = 60 * 60 * 12; // 12 hours

const encoder = new TextEncoder();

function configuredPin(): string | null {
  const pin = process.env.ACCESS_PIN?.trim();
  return pin ? pin : null;
}

export function isAccessConfigured(): boolean {
  return configuredPin() !== null;
}

/** Compares two strings without bailing out early on the first mismatch. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isCorrectPin(input: string): boolean {
  const pin = configuredPin();
  return pin !== null && safeEqual(input, pin);
}

async function sign(message: string): Promise<string> {
  const pin = configuredPin();
  if (!pin) throw new Error("ACCESS_PIN is not set");
  // Changing the PIN or SESSION_SECRET invalidates every issued cookie.
  const secret = `${process.env.SESSION_SECRET ?? ""}:${pin}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createAccessToken(now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + ACCESS_TTL_SECONDS;
  return `${expires}.${await sign(`eve-access.${expires}`)}`;
}

export async function verifyAccessToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token || !isAccessConfigured()) return false;
  const [expiresPart, signature] = token.split(".");
  const expires = Number(expiresPart);
  if (!Number.isInteger(expires) || !signature || expires * 1000 <= now) return false;
  return safeEqual(signature, await sign(`eve-access.${expires}`));
}
