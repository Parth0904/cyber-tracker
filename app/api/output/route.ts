import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const rows = db.prepare(`
    SELECT type, COUNT(*) as total
    FROM activities
    WHERE date = ?
    GROUP BY type
  `).all(today) as { type: string; total: number }[];

  let recon = 0;
  let targets = 0;
  let findings = 0;

  rows.forEach((row) => {
    if (row.type === "recon_session") recon = row.total;
    if (row.type === "target_tested") targets = row.total;
    if (row.type === "finding") findings = row.total;
  });

  const output =
    recon +
    targets +
    findings * 5;

  return NextResponse.json({
    recon,
    targets,
    findings,
    output,
  });
}