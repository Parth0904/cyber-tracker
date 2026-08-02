import { NextResponse } from "next/server";
import { terminateLearningSession } from "@/lib/repositories/learning";

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
    await terminateLearningSession(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to terminate learning session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
