import { NextResponse } from "next/server";
import { getCorrelationDiagnostics } from "@/lib/services/correlationEngine";

export async function GET() {
  try {
    const diagnostics = await getCorrelationDiagnostics();
    return NextResponse.json(diagnostics);
  } catch (err) {
    console.error("Failed to compile insights intelligence payload:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      reply: "AI Coach will be available in a future update.",
      prompt: body.prompt ?? "",
    });
  } catch (err) {
    console.error("Failed handling insights prompt:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}