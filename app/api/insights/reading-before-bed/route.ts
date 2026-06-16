import db from "@/lib/db";
import { NextResponse } from "next/server";

function outputForDate(date: string) {
  const rows = db.prepare(`
    SELECT type
    FROM activities
    WHERE date = ?
  `).all(date) as { type: string }[];

  let output = 0;

  rows.forEach((row) => {
    if (row.type === "recon_session") output += 1;
    if (row.type === "target_tested") output += 2;
    if (row.type === "finding") output += 10;
  });

  return output;
}

export async function GET() {
  const entries = db.prepare(`
    SELECT date, reading_before_bed_minutes
    FROM daily_entries
  `).all() as any[];

  const buckets = {
    none: { total: 0, days: 0 },
    medium: { total: 0, days: 0 },
    high: { total: 0, days: 0 },
  };

  entries.forEach((entry) => {
    const output = outputForDate(entry.date);
    const mins = entry.reading_before_bed_minutes || 0;

    if (mins === 0) {
      buckets.none.total += output;
      buckets.none.days++;
    } else if (mins <= 20) {
      buckets.medium.total += output;
      buckets.medium.days++;
    } else {
      buckets.high.total += output;
      buckets.high.days++;
    }
  });

  return NextResponse.json({
    none: {
      average: buckets.none.days
        ? buckets.none.total / buckets.none.days
        : 0,
      days: buckets.none.days,
    },

    medium: {
      average: buckets.medium.days
        ? buckets.medium.total / buckets.medium.days
        : 0,
      days: buckets.medium.days,
    },

    high: {
      average: buckets.high.days
        ? buckets.high.total / buckets.high.days
        : 0,
      days: buckets.high.days,
    },
  });
}