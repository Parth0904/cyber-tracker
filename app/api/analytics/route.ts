import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const totalLabs =
    (db.prepare(`
      SELECT COUNT(*) as total
      FROM activities
      WHERE type='lab_completed'
    `).get() as { total: number }).total;

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

  const workoutDays =
    (db.prepare(`
      SELECT COUNT(*) as total
      FROM daily_entries
      WHERE workout = 1
    `).get() as { total: number }).total;

  const focusFeeling =
    (db.prepare(`
      SELECT focus_feeling, COUNT(*) as total
      FROM daily_entries
      WHERE focus_feeling IS NOT NULL
      AND focus_feeling != ''
      GROUP BY focus_feeling
      ORDER BY total DESC
      LIMIT 1
    `).get() as
      | { focus_feeling: string }
      | undefined)?.focus_feeling ?? "No Data";

  const dayFeeling =
    (db.prepare(`
      SELECT day_feeling, COUNT(*) as total
      FROM daily_entries
      WHERE day_feeling IS NOT NULL
      AND day_feeling != ''
      GROUP BY day_feeling
      ORDER BY total DESC
      LIMIT 1
    `).get() as
      | { day_feeling: string }
      | undefined)?.day_feeling ?? "No Data";

  return NextResponse.json({
    totalLabs,
    totalRecon,
    totalTargets,
    totalFindings,
    avgSleep,
    workoutDays,
    focusFeeling,
    dayFeeling,
  });
}