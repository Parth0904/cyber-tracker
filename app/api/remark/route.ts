import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const rows = db.prepare(`
    SELECT type, COUNT(*) as total
    FROM activities
    WHERE date = ?
    GROUP BY type
  `).all(today);

  let score = 0;

  rows.forEach((row: any) => {
    score += row.total;
  });

  let remark = "Poor";

  if (score >= 3) remark = "Average";
  if (score >= 6) remark = "Good";
  if (score >= 10) remark = "Excellent";
  if (score >= 15) remark = "Exceptional";

  return NextResponse.json({
    score,
    remark,
  });
}