import { NextResponse } from "next/server";
import { calculateConsistency } from "@/lib/services/consistency";

export async function GET() {
  const result = await calculateConsistency();
  return NextResponse.json(result);
}
