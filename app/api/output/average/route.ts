import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = db.prepare(`
    SELECT date, type, COUNT(*) as total
    FROM activities
    GROUP BY date, type
  `).all() as {
    date: string;
    type: string;
    total: number;
  }[];

  const dailyOutputs: Record<string, number> = {};

  rows.forEach((row) => {
    if (!dailyOutputs[row.date]) {
      dailyOutputs[row.date] = 0;
    }

    if (row.type === "lab_completed")
      dailyOutputs[row.date] += row.total;

    if (row.type === "recon_session")
      dailyOutputs[row.date] += row.total;

    if (row.type === "target_tested")
      dailyOutputs[row.date] += row.total;

    if (row.type === "finding")
      dailyOutputs[row.date] += row.total * 5;
  });

  const outputs = Object.values(dailyOutputs);

  const average =
    outputs.length > 0
      ? outputs.reduce((a, b) => a + b, 0) /
        outputs.length
      : 0;

  return NextResponse.json({
    average,
  });
}