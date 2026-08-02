import { NextResponse } from "next/server";
import {
  updateLearningSessionTimes,
  continueLearningSession,
  endLearningSessionAtLastActive
} from "@/lib/repositories/learning";

export async function PATCH(
  req: Request,
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
    const body = await req.json();

    if (body.action === "continue") {
      await continueLearningSession(Number(id));
      return NextResponse.json({ success: true });
    }

    if (body.action === "end_last_active") {
      await endLearningSessionAtLastActive(Number(id));
      return NextResponse.json({ success: true });
    }

    const { startedAt, endedAt } = body;
    if (!startedAt || !endedAt) {
      return NextResponse.json({ error: "Start time and end time are required" }, { status: 400 });
    }

    await updateLearningSessionTimes(Number(id), startedAt, endedAt);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to edit learning session times:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
