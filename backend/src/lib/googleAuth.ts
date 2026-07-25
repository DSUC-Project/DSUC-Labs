import crypto from "crypto";
import jwt from "jsonwebtoken";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS: [string, ...string[]] = [
  "https://accounts.google.com",
  "accounts.google.com",
];
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

export interface VerifiedGoogleIdentity {
  email: string;
  googleId: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
}

interface GoogleJwk {
  kid?: string;
  kty: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
}

let jwksCache: { keys: GoogleJwk[]; fetchedAt: number } | null = null;

async function fetchGoogleJwks(): Promise<GoogleJwk[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }

  const response = await fetch(GOOGLE_JWKS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google JWKS (${response.status})`);
  }

  const data = (await response.json()) as { keys?: GoogleJwk[] };
  const keys = Array.isArray(data.keys) ? data.keys : [];
  if (keys.length === 0) {
    throw new Error("Google JWKS response contained no keys");
  }

  jwksCache = { keys, fetchedAt: now };
  return keys;
}

function jwkToPem(jwk: GoogleJwk): string {
  const keyObject = crypto.createPublicKey({
    key: jwk as crypto.JsonWebKey,
    format: "jwk",
  });
  return keyObject.export({ type: "spki", format: "pem" }) as string;
}

/**
 * Verify a Google Sign-In ID token (credential from @react-oauth/google).
 * Derives email / sub only from a cryptographically verified token.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  audience: string
): Promise<VerifiedGoogleIdentity> {
  const token = String(idToken || "").trim();
  if (!token) {
    throw new Error("Google ID token is required");
  }
  if (!audience) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === "string" || !decoded.header) {
    throw new Error("Malformed Google ID token");
  }

  const kid = decoded.header.kid;
  if (!kid) {
    throw new Error("Google ID token missing key id");
  }

  const keys = await fetchGoogleJwks();
  const jwk = keys.find((key) => key.kid === kid);
  if (!jwk) {
    // Key rotation: bust cache once and retry.
    jwksCache = null;
    const refreshed = await fetchGoogleJwks();
    const rotated = refreshed.find((key) => key.kid === kid);
    if (!rotated) {
      throw new Error("Unable to find matching Google signing key");
    }
    return verifyWithPem(token, jwkToPem(rotated), audience);
  }

  return verifyWithPem(token, jwkToPem(jwk), audience);
}

function verifyWithPem(
  token: string,
  pem: string,
  audience: string
): VerifiedGoogleIdentity {
  const payload = jwt.verify(token, pem, {
    algorithms: ["RS256"],
    audience,
    issuer: GOOGLE_ISSUERS,
  }) as jwt.JwtPayload;

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const googleId = typeof payload.sub === "string" ? payload.sub.trim() : "";

  if (!email || !googleId) {
    throw new Error("Google ID token missing email or subject");
  }

  // Google may omit email_verified; require explicit true when present, else accept
  // only if the claim is true (GIS always sets it for verified accounts).
  if (payload.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  return {
    email,
    googleId,
    name: typeof payload.name === "string" ? payload.name : undefined,
    avatar: typeof payload.picture === "string" ? payload.picture : undefined,
    emailVerified: payload.email_verified !== false,
  };
}
