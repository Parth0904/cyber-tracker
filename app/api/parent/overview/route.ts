import { NextResponse } from "next/server";
import { getParentPortalOverview } from "@/lib/services/parentPortal";

export const dynamic = "force-dynamic";

/**
 * GET /api/parent/overview
 * Read-only endpoint compiling high-level weekly, monthly, yearly, and holiday summaries.
 * Zero database writes.
 */
export async function GET() {
  try {
    const overview = await getParentPortalOverview();
    return NextResponse.json(overview);
  } catch (err) {
    console.error("Failed compiling Parent Portal overview:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
