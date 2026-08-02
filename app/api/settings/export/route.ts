import { NextResponse } from "next/server";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllTargetsWithArchived } from "@/lib/repositories/targets";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllFindings } from "@/lib/repositories/targetFindings";
import { getAllTopics, getAllLearningSessions } from "@/lib/repositories/learning";
import { getAllActivities } from "@/lib/repositories/activities";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  try {
    const [
      dailyEntries,
      targets,
      sessions,
      findings,
      topics,
      learningSessions,
      activities,
    ] = await Promise.all([
      getAllDailyEntries(),
      getAllTargetsWithArchived(),
      getAllSessions(),
      getAllFindings(),
      getAllTopics(),
      getAllLearningSessions(),
      getAllActivities(),
    ]);

    const backup = {
      version: "1.5",
      exportedAt: new Date().toISOString(),
      data: {
        dailyEntries,
        targets,
        sessions,
        findings,
        topics,
        learningSessions,
        activities,
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
          "Content-Disposition": `attachment; filename="cyber-tracker-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON (default & primary)
    const jsonStr = JSON.stringify(backup, null, 2);
    return new Response(jsonStr, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="cyber-tracker-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
