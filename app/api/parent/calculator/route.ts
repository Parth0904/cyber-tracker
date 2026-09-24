import { NextRequest, NextResponse } from "next/server";
import {
  calculateParentHolidaySimulation,
  ParentSimulationRequest,
} from "@/lib/services/parentPortal";

export const dynamic = "force-dynamic";

/**
 * POST /api/parent/calculator
 * Predictive calculation endpoint for parent time-off inquiry.
 * Zero database writes.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ParentSimulationRequest = await req.json();
    if (typeof body.holidays !== "number" || isNaN(body.holidays)) {
      return NextResponse.json(
        { error: "Invalid parameter: 'holidays' must be a valid number." },
        { status: 400 }
      );
    }

    const result = await calculateParentHolidaySimulation(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed calculating parent holiday simulation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
