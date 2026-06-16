import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const today = new Date().toISOString().split("T")[0];

    const entry = db
        .prepare(
            `
      SELECT *
      FROM daily_entries
      WHERE date = ?
    `
        )
        .get(today);

    return NextResponse.json(entry || {});
}

export async function POST(req: Request) {
  const body = await req.json();

  const today =
    new Date().toISOString().split("T")[0];

  db.prepare(`
    INSERT OR REPLACE INTO daily_entries (
      date,
      sleep_hours,
      wake_time,
      workout,

      learning_hours,

      reading_before_bed_minutes,
      bug_report_study_minutes,

      no_screen_hours,

      focus_feeling,

      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    today,

    body.sleep_hours,
    body.wake_time,
    body.workout ? 1 : 0,

    body.learning_hours,

    body.reading_before_bed_minutes,
    body.bug_report_study_minutes,

    body.no_screen_hours,

    body.focus_feeling,

    body.notes
  );

  return NextResponse.json({
    success: true,
  });
}