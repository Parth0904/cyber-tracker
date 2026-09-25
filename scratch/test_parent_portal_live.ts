import "dotenv/config";
import assert from "node:assert/strict";

async function main() {
  console.log("=== Live Integration Verification: Parent Portal ===");

  const baseUrl = "http://localhost:3000";

  // 1. Owner Authentication
  const password = process.env.AUTH_PASSWORD || "devpassword123";
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  assert.equal(loginRes.status, 200, "Owner login must succeed");
  const cookie = loginRes.headers.get("set-cookie") || "";
  console.log("✓ Step 1: Owner successfully logged in.");

  // 2. Owner generates Parent Portal Share Link
  const createRes = await fetch(`${baseUrl}/api/settings/parent-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: JSON.stringify({ label: "Live Mom & Dad" }),
  });
  assert.equal(createRes.status, 200, "Create token must succeed");
  const createJson = await createRes.json();
  assert.ok(createJson.token, "Must return raw token");
  assert.ok(createJson.tokenRecord?.id, "Must return tokenRecord with ID");
  const rawToken = createJson.token;
  const tokenId = createJson.tokenRecord.id;
  console.log(`✓ Step 2: Created parent token (id: ${tokenId}, length: ${rawToken.length})`);

  // 3. Owner lists tokens
  const listRes = await fetch(`${baseUrl}/api/settings/parent-token`, {
    headers: { cookie },
  });
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  const foundToken = listJson.tokens.find((t: any) => t.id === tokenId);
  assert.ok(foundToken, "Created token must appear in owner list");
  assert.equal(foundToken.token_hash, undefined, "Token hash must NEVER be exposed in API");
  console.log("✓ Step 3: Owner listed parent tokens (no token_hash exposed).");

  // 4. Unauthenticated parent accesses GET /api/parent/[token] (NO COOKIE)
  const parentApiRes = await fetch(`${baseUrl}/api/parent/${rawToken}`);
  assert.equal(parentApiRes.status, 200, "Parent API must return 200 without login");
  const parentData = await parentApiRes.json();
  assert.equal(parentData.success, true);
  assert.equal(parentData.data.studentName, "Parth");
  assert.equal(parentData.data.label, "Live Mom & Dad");
  assert.ok(parentData.data.selectedMonth?.days?.length > 27, "Must contain month days");
  assert.ok(parentData.data.recentPerformance?.length === 7, "Must contain last 7 days");
  assert.ok(typeof parentData.data.allTimeSummary?.totalWorkFormatted === "string");
  console.log("✓ Step 4: Parent read-only API returned authoritative data:", {
    month: `${parentData.data.selectedMonth.monthName} ${parentData.data.selectedMonth.year}`,
    plannedWorkdays: parentData.data.selectedMonth.plannedWorkdays,
    actualWork: parentData.data.selectedMonth.actualWorkFormatted,
    recentDaysCount: parentData.data.recentPerformance.length,
    allTimeWork: parentData.data.allTimeSummary.totalWorkFormatted,
  });

  // 5. Unauthenticated parent accesses GET /parent/[token] HTML page (NO COOKIE)
  const parentPageRes = await fetch(`${baseUrl}/parent/${rawToken}`, {
    redirect: "manual",
  });
  assert.equal(parentPageRes.status, 200, "Parent page must return 200 (not redirected to /login)");
  console.log("✓ Step 5: Parent page /parent/[token] accessible without session cookie.");

  // 6. Access with invalid random token returns 404
  const invalidRes = await fetch(`${baseUrl}/api/parent/fake-token-12345-not-found`);
  assert.equal(invalidRes.status, 404, "Invalid token must return 404");
  console.log("✓ Step 6: Invalid token returns 404.");

  // 7. Read-only boundary: POST /api/parent/[token] returns 405 Method Not Allowed
  const writeRes = await fetch(`${baseUrl}/api/parent/${rawToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tryToWrite: true }),
  });
  assert.equal(writeRes.status, 405, "POST to parent endpoint must return 405");
  console.log("✓ Step 7: Write attempt on parent API returns 405 Method Not Allowed.");

  // 8. Owner revokes the token
  const revokeRes = await fetch(`${baseUrl}/api/settings/parent-token/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: JSON.stringify({ id: tokenId }),
  });
  assert.equal(revokeRes.status, 200, "Revoke token must succeed");
  console.log("✓ Step 8: Owner revoked parent token.");

  // 9. Parent accesses revoked token -> returns 403 with error "revoked"
  const postRevokeRes = await fetch(`${baseUrl}/api/parent/${rawToken}`);
  assert.equal(postRevokeRes.status, 403, "Revoked token must return 403");
  const postRevokeJson = await postRevokeRes.json();
  assert.equal(postRevokeJson.error, "revoked");
  console.log("✓ Step 9: Revoked token rejected with 403 (error: revoked).");

  console.log("=== All Live Parent Portal Verifications Passed! ===");
}

main().catch((err) => {
  console.error("Live verification failed:", err);
  process.exit(1);
});
