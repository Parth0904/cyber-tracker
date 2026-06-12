import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  db.prepare(`
    INSERT INTO activities (date,type,value)
    VALUES (?,?,?)
  `).run(
    new Date().toISOString().split("T")[0],
    body.type,
    1
  );

  return NextResponse.json({ success: true });
}