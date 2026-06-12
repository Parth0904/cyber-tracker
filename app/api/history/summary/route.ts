import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = db.prepare(`
    SELECT
      date,
      type,
      COUNT(*) as total
    FROM activities
    GROUP BY date, type
    ORDER BY date DESC
  `).all();

  return NextResponse.json(rows);
}