import { NextResponse } from "next/server";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllWorkTimeDaily } from "@/lib/repositories/workTimeDaily";

// Cron-ready backup endpoint
// Can be triggered by Vercel cron, external scheduler, or manual call
export async function GET() {
  try {
    const [
      dailyEntries,
      workTimeDaily,
    ] = await Promise.all([
      getAllDailyEntries(),
      getAllWorkTimeDaily(),
    ]);

    const backup = {
      version: "2.0",
      type: "automatic-backup",
      createdAt: new Date().toISOString(),
      data: {
        dailyEntries,
        workTimeDaily,
      },
    };

    return NextResponse.json({
      success: true,
      backup,
      summary: {
        dailyEntries: dailyEntries.length,
        workTimeDaily: workTimeDaily.length,
        totalRecords: dailyEntries.length + workTimeDaily.length,
      },
    });
  } catch (err) {
    console.error("Automatic backup failed:", err);
    return NextResponse.json(
      { error: "Backup failed", details: String(err) },
      { status: 500 }
    );
  }
}
