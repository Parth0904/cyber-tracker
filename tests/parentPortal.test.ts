import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  createParentPortalToken,
  verifyAndGetParentPortalToken,
  isTokenRevoked,
  revokeParentPortalToken,
  getAllParentPortalTokens,
  getActiveParentPortalTokens,
  hashParentToken,
} from "../lib/repositories/parentPortalTokens";
import { compileParentPortalData } from "../lib/services/parentPortal/portalData";
import { upsertCalendarOverride, deleteCalendarOverride } from "../lib/repositories/calendarOverrides";
import { upsertWorkTimeDaily } from "../lib/repositories/workTimeDaily";
import { one } from "../lib/database/query";

test("Parent Portal — Security, Access Control, and Read-Only Invariants", async (t) => {
  const tz = "Asia/Kolkata";

  // 1. TOKEN GENERATION & SECRECY
  await t.test("1. Token generation creates unpredictable 64-character token and stores only SHA-256 hash", async () => {
    const { tokenRecord, rawToken } = await createParentPortalToken({ label: "Test Mom & Dad" });

    // Raw token checks
    assert.equal(typeof rawToken, "string");
    assert.equal(rawToken.length, 64, "Raw token must be 64 hex characters (32 bytes)");
    assert.ok(/^[0-9a-f]{64}$/.test(rawToken), "Raw token must be valid hexadecimal");

    // Token record checks
    assert.ok(tokenRecord.id.startsWith("ppt_"));
    assert.equal(tokenRecord.label, "Test Mom & Dad");
    assert.equal(tokenRecord.revoked_at, null);

    // Database verification: verify that rawToken is NEVER stored in the database
    const dbRow = await one<{ token_hash: string; raw_token?: any }>(
      `SELECT token_hash FROM parent_portal_tokens WHERE id = ?`,
      tokenRecord.id
    );

    assert.ok(dbRow, "Token row must exist in database");
    assert.equal(dbRow?.token_hash, hashParentToken(rawToken), "Stored value must match SHA-256 hash");
    assert.notEqual(dbRow?.token_hash, rawToken, "Token hash must not equal raw token");

    // Ensure list queries do not expose token_hash
    const allTokens = await getAllParentPortalTokens();
    const found = allTokens.find((tok) => tok.id === tokenRecord.id);
    assert.ok(found);
    assert.equal((found as any).token_hash, undefined, "List queries must never expose token_hash");
  });

  // 2. TOKEN VALIDATION: VALID VS INVALID
  await t.test("2. Token validation succeeds for valid token and fails for invalid token", async () => {
    const { rawToken } = await createParentPortalToken({ label: "Valid Test" });

    // Valid token
    const validResult = await verifyAndGetParentPortalToken(rawToken);
    assert.ok(validResult, "Valid token must resolve");
    assert.equal(validResult?.label, "Valid Test");

    // Invalid tokens
    const fakeToken = crypto.randomBytes(32).toString("hex");
    const fakeResult = await verifyAndGetParentPortalToken(fakeToken);
    assert.equal(fakeResult, null, "Random unknown token must return null");

    const emptyResult = await verifyAndGetParentPortalToken("");
    assert.equal(emptyResult, null, "Empty token must return null");

    const malformedResult = await verifyAndGetParentPortalToken("not-a-valid-token-123");
    assert.equal(malformedResult, null, "Malformed token must return null");
  });

  // 3. TOKEN REVOCATION
  await t.test("3. Token revocation immediately denies access and flags revoked state", async () => {
    const { tokenRecord, rawToken } = await createParentPortalToken({ label: "To Revoke" });

    // Initially active
    assert.equal(await isTokenRevoked(rawToken), false);
    assert.ok(await verifyAndGetParentPortalToken(rawToken));

    // Revoke
    const revokedSuccess = await revokeParentPortalToken(tokenRecord.id);
    assert.equal(revokedSuccess, true);

    // Verification must now fail
    const postRevokeResult = await verifyAndGetParentPortalToken(rawToken);
    assert.equal(postRevokeResult, null, "Revoked token must not verify");

    // isTokenRevoked must return true
    assert.equal(await isTokenRevoked(rawToken), true, "Revocation flag must be true");

    // Active tokens list must not include this token
    const activeTokens = await getActiveParentPortalTokens();
    const foundInActive = activeTokens.find((t) => t.id === tokenRecord.id);
    assert.equal(foundInActive, undefined, "Revoked token must not appear in active tokens list");
  });

  // 4. DATA ISOLATION & AUTHORITATIVE DATA INTEGRITY
  await t.test("4. Parent Portal payload is strictly read-only and consumes authoritative engines", async () => {
    const { tokenRecord } = await createParentPortalToken({ label: "Read-Only Test" });

    // Seed test work time on Sept 18, 2026: 8h 32m (30,720s)
    await upsertWorkTimeDaily("2026-09-18", 30720, "windows_agent");
    await upsertCalendarOverride("2026-09-18", "WORKDAY", "Web Security");

    const payload = await compileParentPortalData({
      tokenRecord,
      year: 2026,
      month: 9,
      timezone: tz,
      asOfDateStr: "2026-09-25",
    });

    // Student identity
    assert.equal(payload.studentName, "Parth");
    assert.equal(payload.label, "Read-Only Test");

    // Monthly calendar verification
    assert.equal(payload.selectedMonth.year, 2026);
    assert.equal(payload.selectedMonth.month, 9);
    assert.equal(payload.selectedMonth.monthName, "September");
    assert.equal(payload.selectedMonth.plannedWorkdays, 22);
    assert.equal(payload.selectedMonth.requiredHours, 176);

    // Check Sept 18 specific day cell
    const sept18 = payload.selectedMonth.days.find((d) => d.date === "2026-09-18");
    assert.ok(sept18);
    assert.equal(sept18?.plannedStatus, "WORKDAY");
    assert.equal(sept18?.topic, "Web Security");
    assert.equal(sept18?.actualWorkFormatted, "8h 32m");
    assert.equal(sept18?.actualWorkSeconds, 30720);

    // Recent performance contains last 7 days
    assert.equal(payload.recentPerformance.length, 7);
    const lastDay = payload.recentPerformance[payload.recentPerformance.length - 1];
    assert.equal(lastDay.date, "2026-09-25");
    assert.equal(lastDay.isToday, true);

    // All-time summary has no secrets or admin properties
    assert.ok(typeof payload.allTimeSummary.totalWorkFormatted === "string");
    assert.ok(typeof payload.allTimeSummary.activeDaysCount === "number");
    assert.equal((payload as any).password, undefined);
    assert.equal((payload as any).databaseUrl, undefined);
    assert.equal((payload as any).secret, undefined);

    // Clean up test override
    await deleteCalendarOverride("2026-09-18");
  });

  // 5. WORK ON HOLIDAYS IN PARENT PORTAL
  await t.test("5. Actual work performed on HOLIDAY remains visible and counted in Parent Portal", async () => {
    const { tokenRecord } = await createParentPortalToken({ label: "Holiday Work Test" });

    // Sept 20, 2026 is Sunday (default HOLIDAY). Seed 4h (14,400s)
    await upsertWorkTimeDaily("2026-09-20", 14400, "windows_agent");

    const payload = await compileParentPortalData({
      tokenRecord,
      year: 2026,
      month: 9,
      timezone: tz,
      asOfDateStr: "2026-09-25",
    });

    const sunday = payload.selectedMonth.days.find((d) => d.date === "2026-09-20");
    assert.ok(sunday);
    assert.equal(sunday?.plannedStatus, "HOLIDAY");
    // Work time is NOT suppressed by holiday status
    assert.equal(sunday?.actualWorkFormatted, "4h 00m");
    assert.equal(sunday?.actualWorkSeconds, 14400);
  });

  // 6. FUTURE MONTH BEHAVIOR
  await t.test("6. Future month displays planned schedule but zero actual work unless tracked", async () => {
    const { tokenRecord } = await createParentPortalToken({ label: "Future Month Test" });

    // December 2026 (future relative to Sept 2026)
    const payload = await compileParentPortalData({
      tokenRecord,
      year: 2026,
      month: 12,
      timezone: tz,
      asOfDateStr: "2026-09-25",
    });

    assert.equal(payload.selectedMonth.year, 2026);
    assert.equal(payload.selectedMonth.month, 12);
    // December 2026 has 23 weekdays (184h required)
    assert.equal(payload.selectedMonth.plannedWorkdays, 23);
    assert.equal(payload.selectedMonth.requiredHours, 184);

    // Future days have isFuture: true
    const dec1 = payload.selectedMonth.days.find((d) => d.date === "2026-12-01");
    assert.ok(dec1);
    assert.equal(dec1?.isFuture, true);
    assert.equal(dec1?.actualWorkSeconds, 0);
  });

  // 7. HISTORICAL MONTH BEHAVIOR
  await t.test("7. Historical months remain fully accessible to parents", async () => {
    const { tokenRecord } = await createParentPortalToken({ label: "History Test" });

    // August 2026
    const payload = await compileParentPortalData({
      tokenRecord,
      year: 2026,
      month: 8,
      timezone: tz,
      asOfDateStr: "2026-09-25",
    });

    assert.equal(payload.selectedMonth.year, 2026);
    assert.equal(payload.selectedMonth.month, 8);
    assert.equal(payload.selectedMonth.monthName, "August");
    // August 2026 has 21 weekdays
    assert.equal(payload.selectedMonth.plannedWorkdays, 21);
    assert.equal(payload.selectedMonth.requiredHours, 168);

    const aug10 = payload.selectedMonth.days.find((d) => d.date === "2026-08-10");
    assert.ok(aug10);
    assert.equal(aug10?.isPast, true);
  });

  // 8. READ-ONLY ENDPOINT METHOD VALIDATION
  await t.test("8. Read-only API router rejects POST, PUT, DELETE, PATCH with 405 Method Not Allowed", async () => {
    const apiRoute = await import("../app/api/parent/[token]/route");

    const postRes = await apiRoute.POST();
    assert.equal(postRes.status, 405, "POST must be rejected with 405");

    const putRes = await apiRoute.PUT();
    assert.equal(putRes.status, 405, "PUT must be rejected with 405");

    const deleteRes = await apiRoute.DELETE();
    assert.equal(deleteRes.status, 405, "DELETE must be rejected with 405");

    const patchRes = await apiRoute.PATCH();
    assert.equal(patchRes.status, 405, "PATCH must be rejected with 405");
  });
});
