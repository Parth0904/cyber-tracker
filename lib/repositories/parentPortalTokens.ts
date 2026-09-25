import crypto from "node:crypto";
import { one, many, execute } from "../database/query";

export interface ParentPortalTokenRecord {
  id: string;
  label: string | null;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

interface ParentPortalTokenRow extends ParentPortalTokenRecord {
  token_hash: string;
}

/**
 * Computes a SHA-256 hash of a raw token.
 */
export function hashParentToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Creates a cryptographically random parent portal share token.
 * 
 * Security:
 * - Generates 32 random bytes (64 hex characters) using crypto.randomBytes.
 * - Stores ONLY the SHA-256 hash in the database.
 * - Returns the raw token ONCE to the caller for distribution to parents.
 */
export async function createParentPortalToken(options?: {
  label?: string | null;
  expiresAt?: string | null;
}): Promise<{ tokenRecord: ParentPortalTokenRecord; rawToken: string }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashParentToken(rawToken);
  const id = `ppt_${crypto.randomUUID()}`;
  const label = options?.label?.trim() || null;
  const expiresAt = options?.expiresAt || null;

  const sql = `
    INSERT INTO parent_portal_tokens (id, token_hash, label, created_at, expires_at, revoked_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, NULL)
  `;

  await execute(sql, id, tokenHash, label, expiresAt);

  const row = await one<ParentPortalTokenRow>(
    `SELECT id, label, created_at, expires_at, revoked_at FROM parent_portal_tokens WHERE id = ?`,
    id
  );

  return {
    rawToken,
    tokenRecord: {
      id: row?.id || id,
      label: row?.label || label,
      created_at: row?.created_at || new Date().toISOString(),
      expires_at: row?.expires_at || expiresAt,
      revoked_at: null,
    },
  };
}

/**
 * Validates a raw token against stored token hashes.
 * Returns the token record if valid, non-revoked, and unexpired.
 * Returns null if token does not match or is expired.
 */
export async function verifyAndGetParentPortalToken(rawToken: string): Promise<ParentPortalTokenRecord | null> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
    return null;
  }

  const tokenHash = hashParentToken(rawToken.trim());
  const row = await one<ParentPortalTokenRow>(
    `SELECT id, label, created_at, expires_at, revoked_at
     FROM parent_portal_tokens
     WHERE token_hash = ? AND revoked_at IS NULL`,
    tokenHash
  );

  if (!row) {
    return null;
  }

  // Check expiration if set
  if (row.expires_at) {
    const expiresTime = new Date(row.expires_at).getTime();
    if (Date.now() > expiresTime) {
      return null;
    }
  }

  return {
    id: row.id,
    label: row.label,
    created_at: row.created_at,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
  };
}

/**
 * Checks if a raw token was explicitly revoked.
 */
export async function isTokenRevoked(rawToken: string): Promise<boolean> {
  if (!rawToken || typeof rawToken !== "string") {
    return false;
  }

  const tokenHash = hashParentToken(rawToken.trim());
  const row = await one<{ revoked_at: string | null }>(
    `SELECT revoked_at FROM parent_portal_tokens WHERE token_hash = ?`,
    tokenHash
  );

  return !!row && row.revoked_at !== null;
}

/**
 * Returns all parent portal tokens (both active and revoked) for owner settings management.
 * Note: Never selects or exposes token_hash.
 */
export async function getAllParentPortalTokens(): Promise<ParentPortalTokenRecord[]> {
  const rows = await many<ParentPortalTokenRecord>(
    `SELECT id, label, created_at, expires_at, revoked_at
     FROM parent_portal_tokens
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Returns all currently active (non-revoked) parent portal tokens.
 */
export async function getActiveParentPortalTokens(): Promise<ParentPortalTokenRecord[]> {
  const rows = await many<ParentPortalTokenRecord>(
    `SELECT id, label, created_at, expires_at, revoked_at
     FROM parent_portal_tokens
     WHERE revoked_at IS NULL
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Revokes a specific token by ID immediately.
 */
export async function revokeParentPortalToken(id: string): Promise<boolean> {
  const result = await execute(
    `UPDATE parent_portal_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND revoked_at IS NULL`,
    id
  );
  return true;
}

/**
 * Revokes all active tokens immediately.
 */
export async function revokeAllParentPortalTokens(): Promise<void> {
  await execute(
    `UPDATE parent_portal_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE revoked_at IS NULL`
  );
}
