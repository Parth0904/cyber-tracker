import { NextResponse } from "next/server";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllTargetsWithArchived } from "@/lib/repositories/targets";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllFindings } from "@/lib/repositories/targetFindings";
import { getAllTopics, getAllLearningSessions } from "@/lib/repositories/learning";
import { getAllActivities } from "@/lib/repositories/activities";

// Cron-ready backup endpoint
// Can be triggered by Vercel cron, external scheduler, or manual call
export async function GET() {
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
      type: "automatic-backup",
      createdAt: new Date().toISOString(),
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

    // In future, this can be extended to:
    // - Push to Google Drive API
    // - Commit to a private GitHub repo
    // - Store in cloud storage (S3, GCS, etc.)
    // For now, return the backup payload for download or external storage

    return NextResponse.json({
      success: true,
      backup,
      summary: {
        dailyEntries: dailyEntries.length,
        targets: targets.length,
        sessions: sessions.length,
        findings: findings.length,
        topics: topics.length,
        learningSessions: learningSessions.length,
        activities: activities.length,
        totalRecords:
          dailyEntries.length +
          targets.length +
          sessions.length +
          findings.length +
          topics.length +
          learningSessions.length +
          activities.length,
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
