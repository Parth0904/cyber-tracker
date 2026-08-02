import { NextResponse } from "next/server";
import { getCorrelationDiagnostics } from "@/lib/services/correlationEngine";

export async function GET() {
  try {
    const diagnostics = await getCorrelationDiagnostics();
    return NextResponse.json(diagnostics);
  } catch (err) {
    console.error("Failed to compile analytics intelligence payload:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}