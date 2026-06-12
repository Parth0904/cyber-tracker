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
    SELECT date, no_screen_hours
    FROM daily_entries
    WHERE no_screen_hours IS NOT NULL
  `).all() as {
    date: string;
    no_screen_hours: number;
  }[];

  const buckets = {
    low: { total: 0, days: 0 },     // 0-2
    medium: { total: 0, days: 0 },  // 2-5
    high: { total: 0, days: 0 },    // 5+
  };

  entries.forEach((entry) => {
    const output = outputs[entry.date] || 0;

    if (entry.no_screen_hours < 2) {
      buckets.low.total += output;
      buckets.low.days++;
    } else if (entry.no_screen_hours <= 5) {
      buckets.medium.total += output;
      buckets.medium.days++;
    } else {
      buckets.high.total += output;
      buckets.high.days++;
    }
  });

  return NextResponse.json({
    low: {
      days: buckets.low.days,
      average: buckets.low.days
        ? buckets.low.total / buckets.low.days
        : 0,
    },

    medium: {
      days: buckets.medium.days,
      average: buckets.medium.days
        ? buckets.medium.total / buckets.medium.days
        : 0,
    },

    high: {
      days: buckets.high.days,
      average: buckets.high.days
        ? buckets.high.total / buckets.high.days
        : 0,
    },
  });
}