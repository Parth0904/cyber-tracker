import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const entries = db.prepare(`
    SELECT *
    FROM daily_entries
    ORDER BY date DESC
  `).all();

  return NextResponse.json(entries);
}