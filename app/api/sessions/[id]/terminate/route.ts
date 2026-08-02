import { NextResponse } from "next/server";

import {
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

  const { id } =
    await params;

  await terminateSession(
    Number(id)
  );

  return NextResponse.json({
    success: true,
  });

}