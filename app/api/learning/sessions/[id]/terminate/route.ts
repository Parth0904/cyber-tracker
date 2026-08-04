import { NextResponse } from "next/server";
import { terminateLearningSession, getLearningSession } from "@/lib/repositories/learning";

export async function PATCH(
  _: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;
    const sessionId = Number(id);

    const existing = await getLearningSession(sessionId);
    if (!existing) {
      return NextResponse.json({ error: "Learning session not found" }, { status: 404 });
    }

    await terminateLearningSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to terminate learning session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
