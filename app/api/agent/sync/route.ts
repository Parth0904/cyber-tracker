import { NextRequest, NextResponse } from "next/server";
import { verifyAgentToken, verifySessionToken } from "@/lib/auth";
import { upsertWorkTimeDaily, getAllWorkTimeDaily, getWorkTimeRecord } from "@/lib/repositories/workTimeDaily";

interface SyncRecordInput {
  date: string;
  active_seconds: number;
}

function isAuthorized(req: NextRequest): boolean {
  // Check Bearer token
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (verifyAgentToken(token)) {
      return true;
    }
  }

  // Check cookie session (for browser-based checks/admin view)
  const sessionCookie = req.cookies.get("session")?.value;
  if (sessionCookie && verifySessionToken(sessionCookie)) {
    return true;
  }

  return false;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * POST /api/agent/sync
 * Authenticated idempotent synchronization endpoint for Windows agent work time.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing authentication token" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Support single record or array of records
    let incomingRecords: SyncRecordInput[] = [];
    if (Array.isArray(body.records)) {
      incomingRecords = body.records;
    } else if (body.date && typeof body.active_seconds !== "undefined") {
      incomingRecords = [{ date: body.date, active_seconds: body.active_seconds }];
    } else {
      return NextResponse.json(
        { error: "Expected 'records' array or 'date' and 'active_seconds' properties" },
        { status: 400 }
      );
    }

    if (incomingRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No records to sync",
        count: 0,
        synced: [],
      });
    }

    const synced: SyncRecordInput[] = [];

    console.log(`[AGENT SYNC] Processing ${incomingRecords.length} incoming record(s):`, incomingRecords.map(r => ({ date: r.date, active_seconds: r.active_seconds })));

    for (const rec of incomingRecords) {
      if (!rec.date || !DATE_REGEX.test(rec.date)) {
        return NextResponse.json(
          { error: `Invalid date format: ${rec.date}. Expected YYYY-MM-DD.` },
          { status: 400 }
        );
      }

      const activeSeconds = Math.max(0, Math.floor(Number(rec.active_seconds) || 0));

      await upsertWorkTimeDaily(rec.date, activeSeconds, "windows_agent");
      synced.push({
        date: rec.date,
        active_seconds: activeSeconds,
      });
    }

    console.log(`[AGENT SYNC SUCCESS] Successfully persisted ${synced.length} record(s) to work_time_daily.`);

    return NextResponse.json({
      success: true,
      count: synced.length,
      synced,
    });
  } catch (err) {
    console.error("Agent synchronization fault:", err);
    return NextResponse.json(
      { error: "Internal Server Error during synchronization" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/sync
 * Status check and inspection of synchronized work records.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing authentication token" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (date) {
      const record = await getWorkTimeRecord(date);
      return NextResponse.json({
        date,
        record: record || { date, active_seconds: 0, source: "none" },
      });
    }

    const allRecords = await getAllWorkTimeDaily();
    return NextResponse.json({
      count: allRecords.length,
      records: allRecords,
    });
  } catch (err) {
    console.error("Agent sync query fault:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
