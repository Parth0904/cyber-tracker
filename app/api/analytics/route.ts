import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {

  const totalRecon =
    (db.prepare(`
      SELECT COUNT(*) as total
      FROM activities
      WHERE type='recon_session'
    `).get() as { total: number }).total;

  const totalTargets =
    (db.prepare(`
      SELECT COUNT(*) as total
      FROM activities
      WHERE type='target_tested'
    `).get() as { total: number }).total;

  const totalFindings =
    (db.prepare(`
      SELECT COUNT(*) as total
      FROM activities
      WHERE type='finding'
    `).get() as { total: number }).total;

  const avgSleep =
    (db.prepare(`
      SELECT AVG(sleep_hours) as avg
      FROM daily_entries
    `).get() as { avg: number | null }).avg ?? 0;

  const avgLearning =
    (db.prepare(`
      SELECT AVG(learning_hours) as avg
      FROM daily_entries
    `).get() as { avg: number | null }).avg ?? 0;

  const avgReadingBeforeBed =
    (db.prepare(`
      SELECT AVG(reading_before_bed_minutes) as avg
      FROM daily_entries
    `).get() as { avg: number | null }).avg ?? 0;

  const avgNoScreenHours =
    (db.prepare(`
      SELECT AVG(no_screen_hours) as avg
      FROM daily_entries
    `).get() as { avg: number | null }).avg ?? 0;

  const avgBugReportStudy =
    (db.prepare(`
      SELECT AVG(bug_report_study_minutes) as avg
      FROM daily_entries
    `).get() as { avg: number | null }).avg ?? 0;

  const workoutDays =
    (db.prepare(`
      SELECT COUNT(*) as total
      FROM daily_entries
      WHERE workout = 1
    `).get() as { total: number }).total;

  const focusFeeling =
    (db.prepare(`
      SELECT focus_feeling,
      COUNT(*) as total
      FROM daily_entries
      WHERE focus_feeling IS NOT NULL
      AND focus_feeling != ''
      GROUP BY focus_feeling
      ORDER BY total DESC
      LIMIT 1
    `).get() as
      | { focus_feeling: string }
      | undefined)?.focus_feeling ?? "No Data";

  return NextResponse.json({
    totalRecon,
    totalTargets,
    totalFindings,

    avgSleep,
    avgLearning,

    avgReadingBeforeBed,
    avgNoScreenHours,
    avgBugReportStudy,

    workoutDays,

    focusFeeling,
  });
}