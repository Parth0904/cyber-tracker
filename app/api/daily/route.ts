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

    const today = new Date().toISOString().split("T")[0];

    db.prepare(`
    INSERT OR REPLACE INTO daily_entries (
      date,
      sleep_hours,
      wake_time,
      workout,
      reading_minutes,
      screen_time,
      focus_feeling,
      day_feeling,
      no_screen_hours,
      energy
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        today,
        body.sleep_hours,
        body.wake_time,
        body.workout ? 1 : 0,
        body.reading_minutes,
        body.no_screen_hours,
        body.screen_time,
        body.focus_feeling,
        body.day_feeling,
        body.energy
    );

    return NextResponse.json({ success: true });
}