import { NextRequest, NextResponse } from "next/server";
import {
  updateSessionTimes,
  touchSession,
  finishSessionAtLastActive,
} from "@/lib/repositories/targetSessions";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "continue") {
    await touchSession(Number(id));
    return NextResponse.json({ success: true });
  }

  if (body.action === "end_last_active") {
    await finishSessionAtLastActive(Number(id));
    return NextResponse.json({ success: true });
  }

  const { startedAt, endedAt } = body;
  if (!startedAt || !endedAt) {
    return NextResponse.json(
      { error: "startedAt and endedAt are required for editing" },
      { status: 400 }
    );
  }

  await updateSessionTimes(Number(id), startedAt, endedAt);
  return NextResponse.json({ success: true });
}
