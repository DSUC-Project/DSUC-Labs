import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const CLEANUP_EVERY_MS = 60 * 1000;

export const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface ChallengeRecord {
  nonce: string;
  walletAddress: string;
  message: string;
  expiresAt: number;
}

const challenges = new Map<string, ChallengeRecord>();
let lastCleanup = Date.now();

function cleanupExpiredChallenges() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_EVERY_MS) {
    return;
  }
  lastCleanup = now;
  for (const [key, record] of challenges.entries()) {
    if (record.expiresAt <= now) {
      challenges.delete(key);
    }
  }
}

export function isLikelySolanaAddress(value: string): boolean {
  if (!SOLANA_ADDRESS_RE.test(value)) {
    return false;
  }
  try {
    // Throws if base58 length/bytes are invalid for an ed25519 pubkey.
    // eslint-disable-next-line no-new
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function resolveAuthDomain(): string {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    return new URL(frontendUrl).host || "dsuc.fun";
  } catch {
    return "dsuc.fun";
  }
}

export function buildWalletSignInMessage(params: {
  walletAddress: string;
  nonce: string;
  issuedAt: string;
  domain?: string;
}): string {
  const domain = params.domain || resolveAuthDomain();
  return [
    `${domain} wants you to sign in with your Solana account:`,
    params.walletAddress,
    "",
    "Sign in to DSUC Lab. This request will not trigger a blockchain transaction or cost any fees.",
    "",
    `URI: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
    "Version: 1",
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
  ].join("\n");
}

export function createWalletChallenge(walletAddress: string): {
  nonce: string;
  message: string;
  expires_at: string;
  expires_in_seconds: number;
} {
  cleanupExpiredChallenges();

  const normalized = walletAddress.trim();
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const message = buildWalletSignInMessage({
    walletAddress: normalized,
    nonce,
    issuedAt,
  });
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;

  challenges.set(nonce, {
    nonce,
    walletAddress: normalized,
    message,
    expiresAt,
  });

  return {
    nonce,
    message,
    expires_at: new Date(expiresAt).toISOString(),
    expires_in_seconds: Math.floor(CHALLENGE_TTL_MS / 1000),
  };
}

export function consumeWalletChallenge(
  nonce: string,
  walletAddress: string
): { ok: true; message: string } | { ok: false; reason: string } {
  cleanupExpiredChallenges();

  const record = challenges.get(nonce);
  if (!record) {
    return { ok: false, reason: "Challenge not found or already used" };
  }

  if (record.expiresAt <= Date.now()) {
    challenges.delete(nonce);
    return { ok: false, reason: "Challenge expired" };
  }

  if (record.walletAddress !== walletAddress.trim()) {
    return { ok: false, reason: "Challenge was issued for a different wallet" };
  }

  // One-time use.
  challenges.delete(nonce);
  return { ok: true, message: record.message };
}

function decodeSignature(signature: string): Uint8Array | null {
  const raw = String(signature || "").trim();
  if (!raw) {
    return null;
  }

  // Prefer base64 first — first-party client always sends standard base64 from btoa.
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 64) {
      return new Uint8Array(buf);
    }
  } catch {
    // fall through
  }

  try {
    if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(raw) && raw.length >= 64) {
      const decoded = bs58.decode(raw);
      if (decoded.length === 64) {
        return decoded;
      }
    }
  } catch {
    // fall through
  }

  try {
    // JSON array of bytes from some clients
    if (raw.startsWith("[")) {
      const arr = JSON.parse(raw) as number[];
      if (Array.isArray(arr) && arr.length === 64) {
        return Uint8Array.from(arr);
      }
    }
  } catch {
    // fall through
  }

  return null;
}

/**
 * Verify an ed25519 detached signature over the exact UTF-8 message bytes.
 * Accepts base58, base64, or JSON byte-array signatures (Phantom-style).
 */
export function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): boolean {
  try {
    if (!walletAddress || !signature || !message) {
      return false;
    }
    if (!isLikelySolanaAddress(walletAddress)) {
      return false;
    }

    const signatureBytes = decodeSignature(signature);
    if (!signatureBytes || signatureBytes.length !== 64) {
      return false;
    }

    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
