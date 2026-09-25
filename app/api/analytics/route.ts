import { NextRequest, NextResponse } from "next/server";
import { getGlobalAnalytics } from "@/lib/services/analytics/globalAnalytics";
import { APP_TIMEZONE } from "@/lib/services/metrics/dates";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";

    const payload = await getGlobalAnalytics(range, APP_TIMEZONE);
    return NextResponse.json({
      success: true,
      analytics: payload,
    });
  } catch (err: any) {
    console.error("Failed to compile global analytics payload:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}