import { NextResponse } from "next/server";

import {
  getAllTargets,
} from "@/lib/repositories/targets";

import {
  createNewTarget,
} from "@/lib/services/target";

export async function GET() {

  return NextResponse.json(
    getAllTargets()
  );

}

export async function POST(
  req: Request
) {

  const body =
    await req.json();

  console.log(body);

  createNewTarget(body);

  return NextResponse.json({

    success: true,

  });

}