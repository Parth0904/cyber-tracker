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

    if (row.type === "recon_session")
  outputs[row.date] += row.total * 1;

if (row.type === "target_tested")
  outputs[row.date] += row.total * 2;

if (row.type === "finding")
  outputs[row.date] += row.total * 10;
  });

  const entries = db.prepare(`
    SELECT date, sleep_hours
    FROM daily_entries
    WHERE sleep_hours IS NOT NULL
  `).all() as {
    date: string;
    sleep_hours: number;
  }[];

  const buckets = {
    low: { total: 0, days: 0 },     // < 6
    medium: { total: 0, days: 0 },  // 6-8
    high: { total: 0, days: 0 },    // > 8
  };

  entries.forEach((entry) => {
    const output = outputs[entry.date] || 0;

    if (entry.sleep_hours < 6) {
      buckets.low.total += output;
      buckets.low.days++;
    } else if (entry.sleep_hours <= 8) {
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
      average:
        buckets.low.days > 0
          ? buckets.low.total / buckets.low.days
          : 0,
    },

    medium: {
      days: buckets.medium.days,
      average:
        buckets.medium.days > 0
          ? buckets.medium.total / buckets.medium.days
          : 0,
    },

    high: {
      days: buckets.high.days,
      average:
        buckets.high.days > 0
          ? buckets.high.total / buckets.high.days
          : 0,
    },
  });
}