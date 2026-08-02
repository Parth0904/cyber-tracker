import { NextResponse } from "next/server";

import {
  getAllTargets,
} from "@/lib/repositories/targets";

import {
  createNewTarget,
} from "@/lib/services/target";

import {
  generateTargetStatistics,
} from "@/lib/targets/statistics";

export async function GET() {
  const targets = await getAllTargets();
  const withStats = await Promise.all(
    targets.map(async (t) => ({
      ...t,
      stats: await generateTargetStatistics(t.id),
    }))
  );

  return NextResponse.json(withStats);

}

export async function POST(
  req: Request
) {

  const body =
    await req.json();

  console.log(body);

  await createNewTarget(body);

  return NextResponse.json({

    success: true,

  });

}