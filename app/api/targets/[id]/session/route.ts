import { NextRequest, NextResponse } from "next/server";

import {
  startSession,
} from "@/lib/services/session";

export async function POST(
  req: NextRequest,
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
    const { type, description } = await req.json();

    await startSession(
      Number(id),
      type,
      description
    );

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error("Failed to start session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to start session" },
      { status: 400 }
    );
  }
}