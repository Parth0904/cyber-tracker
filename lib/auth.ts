import crypto from "crypto";
import { env } from "@/lib/env";

/**
 * Verify a password against the plaintext password stored in env.authPassword.
 * Uses a constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const inputBuffer = Buffer.from(password, "utf-8");
    const expectedBuffer = Buffer.from(env.authPassword, "utf-8");
    
    if (inputBuffer.length !== expectedBuffer.length) {
      // Perform a dummy timingSafeEqual with the same buffer to mitigate timing attacks based on length
      crypto.timingSafeEqual(inputBuffer, inputBuffer);
      return false;
    }
    
    return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
  } catch (e) {
    return false;
  }
}

/**
 * Create a signed session token.
 * Token format: <session_id>.<expires_timestamp>.<hmac_signature>
 */
export function createSessionToken(expiresAt: number): string {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const payload = `${sessionId}.${expiresAt}`;
  
  const hmac = crypto.createHmac("sha256", env.authSecret);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  
  return `${payload}.${signature}`;
}

/**
 * Verify a signed session token and ensure it is not expired.
 */
export function verifySessionToken(token: string): boolean {
  try {
    if (!token) return false;
    
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    
    const [sessionId, expiresStr, signature] = parts;
    const payload = `${sessionId}.${expiresStr}`;
    
    // Verify signature
    const hmac = crypto.createHmac("sha256", env.authSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");
    
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    const isSignatureValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!isSignatureValid) return false;
    
    // Verify expiration
    const expiresAt = parseInt(expiresStr, 10);
    if (isNaN(expiresAt)) return false;
    
    return Date.now() < expiresAt;
  } catch (e) {
    return false;
  }
}

/**
 * Verify agent sync Bearer token.
 * Uses constant-time comparison to prevent timing attacks.
 * Accepts either AGENT_SYNC_TOKEN or env.authSecret.
 */
export function verifyAgentToken(token: string): boolean {
  try {
    if (!token || typeof token !== "string") return false;

    const allowedTokens = [
      process.env.AGENT_SYNC_TOKEN,
      env.authSecret,
    ].filter((t): t is string => Boolean(t && t.trim() !== ""));

    const inputBuffer = Buffer.from(token.trim(), "utf-8");

    for (const allowed of allowedTokens) {
      const allowedBuffer = Buffer.from(allowed.trim(), "utf-8");
      if (inputBuffer.length === allowedBuffer.length) {
        if (crypto.timingSafeEqual(inputBuffer, allowedBuffer)) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

