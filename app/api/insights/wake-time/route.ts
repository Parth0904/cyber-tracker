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

    if (row.type === "finding") {
      outputs[row.date] += row.total * 5;
    } else {
      outputs[row.date] += row.total;
    }
  });

  const entries = db.prepare(`
    SELECT date, wake_time
    FROM daily_entries
    WHERE wake_time IS NOT NULL
    AND wake_time != ''
  `).all() as {
    date: string;
    wake_time: string;
  }[];

  const buckets = {
    early: { total: 0, days: 0 },   // before 6
    normal: { total: 0, days: 0 },  // 6-8
    late: { total: 0, days: 0 },    // after 8
  };

  entries.forEach((entry) => {
    const output = outputs[entry.date] || 0;

    const [hours, minutes] = entry.wake_time
      .split(":")
      .map(Number);

    const totalMinutes =
      hours * 60 + minutes;

    if (totalMinutes < 360) {
      buckets.early.total += output;
      buckets.early.days++;
    } else if (totalMinutes <= 480) {
      buckets.normal.total += output;
      buckets.normal.days++;
    } else {
      buckets.late.total += output;
      buckets.late.days++;
    }
  });

  return NextResponse.json({
    early: {
      days: buckets.early.days,
      average: buckets.early.days
        ? buckets.early.total /
          buckets.early.days
        : 0,
    },

    normal: {
      days: buckets.normal.days,
      average: buckets.normal.days
        ? buckets.normal.total /
          buckets.normal.days
        : 0,
    },

    late: {
      days: buckets.late.days,
      average: buckets.late.days
        ? buckets.late.total /
          buckets.late.days
        : 0,
    },
  });
}