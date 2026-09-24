import { NextResponse } from "next/server";
import { getPerformanceOverview } from "@/lib/services/metrics/performance";

export async function GET() {
  try {
    const overview = await getPerformanceOverview();
    return NextResponse.json(overview);
  } catch (err) {
    console.error("Failed to load performance metrics:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
