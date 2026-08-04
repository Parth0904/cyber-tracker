import { NextResponse } from "next/server";
import {
  getSession,
  terminateSession,
} from "@/lib/repositories/targetSessions";

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

    const existing = await getSession(sessionId);
    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await terminateSession(sessionId);

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error("Failed to terminate session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to terminate session" },
      { status: 500 }
    );
  }
}