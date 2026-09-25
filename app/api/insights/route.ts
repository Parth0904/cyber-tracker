import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    deprecated: true,
    message: "Holiday Intelligence calculator has been retired. Use the Monthly Calendar Planner at /api/calendar.",
  });
}

export async function POST() {
  return NextResponse.json({
    deprecated: true,
    message: "Holiday recovery simulation has been retired. Use the Monthly Calendar Planner at /api/calendar.",
  });
}