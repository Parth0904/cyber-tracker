import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const activities = db.prepare(`
    SELECT date, type, COUNT(*) as total
    FROM activities
    GROUP BY date, type
  `).all() as {
    date: string;
    type: string;
    total: number;
  }[];

  const outputs: Record<string, number> = {};

  activities.forEach((row) => {
    if (!outputs[row.date]) {
      outputs[row.date] = 0;
    }

    if (row.type === "finding")
      outputs[row.date] += row.total * 5;
    else
      outputs[row.date] += row.total;
  });

  const dailyEntries = db.prepare(`
    SELECT date, workout
    FROM daily_entries
  `).all() as {
    date: string;
    workout: number;
  }[];

  let workoutTotal = 0;
  let workoutDays = 0;

  let noWorkoutTotal = 0;
  let noWorkoutDays = 0;

  dailyEntries.forEach((entry) => {
    const output = outputs[entry.date] || 0;

    if (entry.workout) {
      workoutTotal += output;
      workoutDays++;
    } else {
      noWorkoutTotal += output;
      noWorkoutDays++;
    }
  });

  return NextResponse.json({
    workoutAverage:
      workoutDays > 0
        ? workoutTotal / workoutDays
        : 0,

    noWorkoutAverage:
      noWorkoutDays > 0
        ? noWorkoutTotal / noWorkoutDays
        : 0,

    workoutDays,
    noWorkoutDays,
  });
}