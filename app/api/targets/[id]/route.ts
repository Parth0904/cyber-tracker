import { NextRequest, NextResponse } from "next/server";

import {
  getTarget,
} from "@/lib/repositories/targets";

export async function GET(
  _: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;

  const target = getTarget(
    Number(id)
  );

  if (!target) {
    return NextResponse.json(
      {
        error: "Target not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(
    target
  );
}

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

  const { id } =
    await params;

  const body =
    await req.json();

  return NextResponse.json({
    success: true,
  });

}