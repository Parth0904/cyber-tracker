import { NextResponse } from "next/server";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllWorkTimeDaily } from "@/lib/repositories/workTimeDaily";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

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
      exportedAt: new Date().toISOString(),
      data: {
        dailyEntries,
        workTimeDaily,
      },
    };

    if (format === "csv") {
      // Build CSV for daily_entries as the primary table
      const headers = Object.keys(dailyEntries[0] || {});
      const csvLines = [
        headers.join(","),
        ...dailyEntries.map((row: any) =>
          headers
            .map((h) => {
              const val = row[h];
              if (val === null || val === undefined) return "";
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ];

      return new Response(csvLines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cyber-tracker-export-${getTodayDateString(APP_TIMEZONE)}.csv"`,
        },
      });
    }

    // JSON (default & primary)
    const jsonStr = JSON.stringify(backup, null, 2);
    return new Response(jsonStr, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="cyber-tracker-backup-${getTodayDateString(APP_TIMEZONE)}.json"`,
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
