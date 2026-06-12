import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const rows = db
    .prepare(
      `
      SELECT type, COUNT(*) as total
      FROM activities
      WHERE date = ?
      GROUP BY type
    `
    )
    .all(today);

  return NextResponse.json(rows);
}