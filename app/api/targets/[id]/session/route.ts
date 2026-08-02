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

  const { id } =
    await params;

  const {
    type,
    description,
  } = await req.json();

  await startSession(
    Number(id),
    type,
    description
  );

  return NextResponse.json({
    success: true,
  });

}