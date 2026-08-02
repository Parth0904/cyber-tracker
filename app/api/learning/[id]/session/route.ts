import { NextResponse } from "next/server";
import { createLearningSession } from "@/lib/repositories/learning";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = Number(id);

    const sessionId = await createLearningSession(topicId);

    return NextResponse.json({ success: true, sessionId });
  } catch (err) {
    console.error("Failed to start learning session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
